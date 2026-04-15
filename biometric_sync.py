#!/usr/bin/env python3
"""
biometric_sync.py — Python/pyzk alternative sync for ZKTeco devices.

Usage:
    python biometric_sync.py <device_id> <log_id>

Requirements:
    pip install -r biometric_requirements.txt
"""

import sys
import os
import json
import datetime

# ---------------------------------------------------------------------------
# Load .env from the Laravel project root so DB credentials are available
# ---------------------------------------------------------------------------
try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env'))
except ImportError:
    pass  # python-dotenv not installed — rely on real env vars

try:
    import pymysql
except ImportError:
    print("ERROR: pymysql not installed. Run: pip install -r biometric_requirements.txt", file=sys.stderr)
    sys.exit(1)

try:
    from zk import ZK
except ImportError:
    print("ERROR: pyzk not installed. Run: pip install -r biometric_requirements.txt", file=sys.stderr)
    sys.exit(1)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def get_db():
    """Open a PyMySQL connection using Laravel .env DB settings."""
    return pymysql.connect(
        host=os.getenv('DB_HOST', '127.0.0.1'),
        port=int(os.getenv('DB_PORT', 3306)),
        user=os.getenv('DB_USERNAME', 'root'),
        password=os.getenv('DB_PASSWORD', ''),
        database=os.getenv('DB_DATABASE', ''),
        charset='utf8mb4',
        autocommit=False,
    )


def update_log(db, log_id: int, **fields):
    """Update a row in biometric_sync_logs."""
    if not fields:
        return
    set_clause = ', '.join(f"`{k}` = %s" for k in fields)
    values = list(fields.values()) + [log_id]
    with db.cursor() as cur:
        cur.execute(f"UPDATE `biometric_sync_logs` SET {set_clause} WHERE `id` = %s", values)
    db.commit()


def now_str() -> str:
    return datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    if len(sys.argv) != 3:
        print("Usage: python biometric_sync.py <device_id> <log_id>", file=sys.stderr)
        sys.exit(1)

    device_id = int(sys.argv[1])
    log_id    = int(sys.argv[2])

    db = get_db()

    try:
        # ── 1. Load device info ──────────────────────────────────────────────
        with db.cursor() as cur:
            cur.execute(
                "SELECT `id`, `name`, `ip_address`, `port` FROM `biometric_devices` WHERE `id` = %s",
                (device_id,)
            )
            row = cur.fetchone()

        if not row:
            update_log(db, log_id,
                status='failed',
                error_message=f'Device {device_id} not found in database',
                completed_at=now_str(),
            )
            return

        dev_id, dev_name, ip_address, port = row

        update_log(db, log_id,
            status='fetching',
            current_stage='Connecting to device (pyzk)...',
            started_at=now_str(),
        )

        # ── 2. Connect via pyzk ──────────────────────────────────────────────
        zk = ZK(ip_address, port=int(port), timeout=15, password=0, force_udp=False, ommit_ping=False)
        conn_zk = None

        try:
            conn_zk = zk.connect()

            update_log(db, log_id, current_stage='Fetching attendance logs (pyzk)...')

            # pyzk returns a list of Attendance objects
            attendance_records = conn_zk.get_attendance()
            total = len(attendance_records)

            update_log(db, log_id,
                current_stage=f'Saving {total} logs to cache...',
                total_logs=total,
            )

            # ── 3. Format to match the PHP ZKTeco library output ─────────────
            raw_logs = []
            for att in attendance_records:
                ts = att.timestamp
                raw_logs.append({
                    'uid':       att.uid,
                    'id':        str(att.user_id),
                    'timestamp': ts.strftime('%Y-%m-%d %H:%M:%S') if ts else None,
                    'state':     att.status, # Matches PHP library "state"
                    'type':      att.punch,  # Matches PHP library "type"
                })

            fetch_time = now_str()

            # ── 4. Write JSON cache (same format as PHP sync) ────────────────
            cache_dir  = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'device-logs')
            os.makedirs(cache_dir, exist_ok=True)
            cache_path = os.path.join(cache_dir, f'cache_device_{dev_id}_raw.json')

            with open(cache_path, 'w', encoding='utf-8') as f:
                # Removed indent=2 for significantly faster writing of large datasets
                json.dump({
                    'device_id':   dev_id,
                    'device_name': dev_name,
                    'fetch_time':  fetch_time,
                    'total_logs':  total,
                    'logs':        raw_logs,
                }, f, ensure_ascii=False)

            # ── 5. Detect unmatched employees ────────────────────────────────
            # Collect unique biometric user IDs present in the attendance logs
            update_log(db, log_id, current_stage='Checking for unmatched employees...')

            unique_biometric_ids = list({str(att.user_id) for att in attendance_records if att.user_id})

            unmatched_ids = []
            if unique_biometric_ids:
                # Build a placeholder list for the IN clause
                placeholders = ', '.join(['%s'] * len(unique_biometric_ids))
                with db.cursor() as cur:
                    cur.execute(
                        f"SELECT `idno` FROM `employees` WHERE `idno` IN ({placeholders})",
                        unique_biometric_ids,
                    )
                    matched_idnos = {str(row[0]) for row in cur.fetchall()}

                unmatched_ids = sorted(
                    bid for bid in unique_biometric_ids if bid not in matched_idnos
                )

            # ── 6. Update device last_sync ───────────────────────────────────
            with db.cursor() as cur:
                cur.execute(
                    "UPDATE `biometric_devices` SET `last_sync` = %s WHERE `id` = %s",
                    (now_str(), dev_id)
                )
            db.commit()

            # ── 7. Mark sync log as completed (include unmatched) ────────────
            unmatched_count = len(unmatched_ids)
            stage_msg = f'Done — {total} logs cached (pyzk)'
            if unmatched_count:
                stage_msg += f', {unmatched_count} unmatched employee(s)'

            update_log(db, log_id,
                status='completed',
                total_logs=total,
                current_stage=stage_msg,
                unmatched_employees=json.dumps(unmatched_ids),
                completed_at=now_str(),
            )

        finally:
            if conn_zk:
                try:
                    conn_zk.disconnect()
                except Exception:
                    pass

    except Exception as exc:
        try:
            update_log(db, log_id,
                status='failed',
                error_message=str(exc),
                completed_at=now_str(),
            )
        except Exception:
            pass

    finally:
        try:
            db.close()
        except Exception:
            pass


if __name__ == '__main__':
    main()
