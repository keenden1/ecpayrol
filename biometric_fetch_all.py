#!/usr/bin/env python3
"""
biometric_fetch_all.py — Fetch and match attendance logs from ALL active ZKTeco devices.

Designed to be run as a scheduled task (daily at 11 PM).
Each device is synced sequentially using biometric_sync.py.

Usage:
    python biometric_fetch_all.py
    python biometric_fetch_all.py --start-date 2026-04-01 --end-date 2026-04-16

Requirements:
    pip install -r biometric_requirements.txt
"""

import sys
import os
import argparse
import subprocess
import datetime
import logging

# ---------------------------------------------------------------------------
# Load .env from the Laravel project root
# ---------------------------------------------------------------------------
try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env'))
except ImportError:
    pass

try:
    import pymysql
except ImportError:
    print("ERROR: pymysql not installed. Run: pip install -r biometric_requirements.txt", file=sys.stderr)
    sys.exit(1)

# ---------------------------------------------------------------------------
# Logging — appends to storage/logs/biometric-fetch-all.log
# ---------------------------------------------------------------------------
LOG_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    'storage', 'logs', 'biometric-fetch-all.log'
)
logging.basicConfig(
    filename=LOG_PATH,
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
)
log = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# DB helpers
# ---------------------------------------------------------------------------

def get_db():
    return pymysql.connect(
        host=os.getenv('DB_HOST', '127.0.0.1'),
        port=int(os.getenv('DB_PORT', 3306)),
        user=os.getenv('DB_USERNAME', 'root'),
        password=os.getenv('DB_PASSWORD', ''),
        database=os.getenv('DB_DATABASE', ''),
        charset='utf8mb4',
        autocommit=False,
    )


def now_str():
    return datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')


def get_active_devices(db):
    with db.cursor() as cur:
        cur.execute(
            "SELECT `id`, `name`, `ip_address`, `port` FROM `biometric_devices` WHERE `status` = 'active' ORDER BY `id`"
        )
        return cur.fetchall()


def is_sync_running(db, device_id):
    """Return True if a sync is already in progress for this device."""
    with db.cursor() as cur:
        cur.execute(
            "SELECT COUNT(*) FROM `biometric_sync_logs` WHERE `device_id` = %s AND `status` IN ('pending', 'fetching')",
            (device_id,)
        )
        count = cur.fetchone()[0]
    return count > 0


def create_sync_log(db, device_id, start_date=None, end_date=None):
    with db.cursor() as cur:
        cur.execute(
            """INSERT INTO `biometric_sync_logs`
               (`device_id`, `initiated_by`, `start_date`, `end_date`, `status`, `current_stage`, `created_at`, `updated_at`)
               VALUES (%s, NULL, %s, %s, 'pending', 'Queued by scheduler (Python)', %s, %s)""",
            (device_id, start_date, end_date, now_str(), now_str())
        )
        db.commit()
        return cur.lastrowid


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description='Fetch logs from all active biometric devices.')
    parser.add_argument('--start-date', default=None, help='Start date filter (YYYY-MM-DD)')
    parser.add_argument('--end-date',   default=None, help='End date filter (YYYY-MM-DD)')
    args = parser.parse_args()

    start_date = args.start_date
    end_date   = args.end_date

    log.info('=' * 60)
    log.info('biometric_fetch_all.py started')
    if start_date or end_date:
        log.info(f'  Date range: {start_date or "any"} → {end_date or "any"}')

    script_dir  = os.path.dirname(os.path.abspath(__file__))
    sync_script = os.path.join(script_dir, 'biometric_sync.py')

    if not os.path.exists(sync_script):
        log.error(f'biometric_sync.py not found at: {sync_script}')
        sys.exit(1)

    db = get_db()

    try:
        devices = get_active_devices(db)

        if not devices:
            log.warning('No active biometric devices found — nothing to do.')
            return

        log.info(f'Found {len(devices)} active device(s).')

        for dev_id, dev_name, ip, port in devices:
            log.info(f'  Processing: {dev_name} ({ip}:{port})')

            # Skip if already syncing
            if is_sync_running(db, dev_id):
                log.warning(f'    Skipped — sync already running for device {dev_id}.')
                continue

            # Create sync log entry
            log_id = create_sync_log(db, dev_id, start_date, end_date)
            log.info(f'    Created sync_log id={log_id}')

            # Run biometric_sync.py for this device
            cmd = [sys.executable, sync_script, str(dev_id), str(log_id)]
            log.info(f'    Running: {" ".join(cmd)}')

            result = subprocess.run(cmd, capture_output=True, text=True)

            if result.returncode == 0:
                log.info(f'    ✓ Completed successfully.')
            else:
                log.error(f'    ✗ Failed (exit {result.returncode}).')
                if result.stderr:
                    log.error(f'    stderr: {result.stderr.strip()}')

    except Exception as exc:
        log.exception(f'Unexpected error: {exc}')

    finally:
        try:
            db.close()
        except Exception:
            pass

    log.info('biometric_fetch_all.py finished.')
    log.info('=' * 60)


if __name__ == '__main__':
    main()
