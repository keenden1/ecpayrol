<?php
namespace App\Http\Controllers;

use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Response;
use Inertia\Inertia;

class EmployeeImportController extends Controller
{
    protected $expectedHeaders = [
        'ID No.', 'Business ID', 'Last Name', 'First Name', 'Middle Name', 'Suffix', 'Gender',
        'Educational Attainment', 'Degree', 'Civil Status', 'Birthdate',
        'Contact No.', 'Email', 'Present Address', 'Permanent Address',
        'Emergency Contact Name', 'Emergency Contact No.', 'Emergency Relationship',
        'Employment Status', 'Job Status', 'Rank/File', 'Department', 'Line',
        'Job Title', 'Hired Date', 'End of Contract', 'Pay Type',
        'Pay Rate', 'Pay Allowance', 'SSS No.', 'PhilHealth No.',
        'HDMF No.', 'Tax No.', 'Taxable', 'Cost Center'
    ];

    public function showImport()
    {
        return Inertia::render('Employee/ImportEmployee', [
            'auth' => [
                'user' => Auth::user(),
            ],
        ]);
    }

    public function import(Request $request)
    {
        try {
            if (!$request->hasFile('file')) {
                return response()->json([
                    'error' => 'No file uploaded'
                ], Response::HTTP_UNPROCESSABLE_ENTITY);
            }

            // Validate file type
            $file = $request->file('file');
            $allowedTypes = [
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-excel'
            ];
            
            if (!in_array($file->getMimeType(), $allowedTypes)) {
                return response()->json([
                    'error' => 'Invalid file type. Please upload an Excel file.'
                ], Response::HTTP_UNPROCESSABLE_ENTITY);
            }

            DB::beginTransaction();
            
            $spreadsheet = IOFactory::load($file->getPathname());
            $worksheet = $spreadsheet->getActiveSheet();
            $rows = $worksheet->toArray();

            // Check if file is empty
            if (count($rows) <= 1) {
                return response()->json([
                    'error' => 'The uploaded file is empty or contains only headers.'
                ], Response::HTTP_UNPROCESSABLE_ENTITY);
            }

            // Remove header row and validate headers
            $headers = array_shift($rows);
            
            // Normalize headers to handle case sensitivity and whitespace
            $headers = array_map(function($header) {
                return trim($header);
            }, $headers);
            
            // Check for missing headers
            $missingHeaders = array_diff($this->expectedHeaders, $headers);
            
            if (!empty($missingHeaders)) {
                return response()->json([
                    'error' => 'Invalid file format. Missing columns: ' . implode(', ', $missingHeaders)
                ], Response::HTTP_UNPROCESSABLE_ENTITY);
            }

            $success = 0;
            $failures = [];
            $rules = $this->getValidationRules();

            foreach ($rows as $index => $row) {
                // Skip empty rows
                if (empty(array_filter($row))) {
                    continue;
                }

                // Handle shorter rows by adding empty values for missing columns
                while (count($row) < count($headers)) {
                    $row[] = '';
                }

                // Ensure row doesn't exceed header length (truncate extra data)
                if (count($row) > count($headers)) {
                    $row = array_slice($row, 0, count($headers));
                }
                
                // Create associative array from row data
                $data = array_combine($headers, $row);
                $data = $this->formatEmployeeData($data);

                // Validate row data
                $validator = Validator::make($data, $rules);

                if ($validator->fails()) {
                    $failures[] = [
                        'row' => $index + 2, // +2 because we removed header row and index is 0-based
                        'errors' => $validator->errors()->all()
                    ];
                    continue;
                }

                try {
                    Employee::create($data);
                    $success++;
                } catch (\Exception $e) {
                    $failures[] = [
                        'row' => $index + 2,
                        'errors' => ['Database error: ' . $e->getMessage()]
                    ];
                }
            }

            DB::commit();
            
            return response()->json([
                'message' => "{$success} employees imported successfully",
                'failures' => $failures,
                'total_processed' => count($rows),
                'successful' => $success,
                'failed' => count($failures)
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            // Log the error for debugging
            \Log::error('Employee import error:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'error' => 'Error processing file: ' . $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    protected function formatEmployeeData($data)
    {
        $taxableRaw = strtolower(trim($data['Taxable'] ?? ''));
        $taxable = in_array($taxableRaw, ['yes', 'true', '1']);

        $payType = trim(strtolower($data['Pay Type'] ?? ''));
        switch ($payType) {
            case 'monthly': case 'month': case 'mo': $payType = 'Monthly'; break;
            case 'weekly':  case 'week':  case 'wk': $payType = 'Weekly';  break;
            case 'daily':   case 'day':               $payType = 'Daily';   break;
            default: $payType = 'Monthly';
        }

        $birthdate   = $this->parseExcelDate($data['Birthdate'] ?? null);
        $hiredDate   = $this->parseExcelDate($data['Hired Date'] ?? null);
        $endOfContract = $this->parseExcelDate($data['End of Contract'] ?? null);

        return [
            'idno'                 => $data['ID No.'] ?? null,
            'bid'                  => $data['Business ID'] ?? null,
            'Lname'                => trim($data['Last Name'] ?? ''),
            'Fname'                => trim($data['First Name'] ?? ''),
            'MName'                => trim($data['Middle Name'] ?? ''),
            'Suffix'               => trim($data['Suffix'] ?? ''),
            'Gender'               => trim($data['Gender'] ?? ''),
            'EducationalAttainment'=> trim($data['Educational Attainment'] ?? ''),
            'Degree'               => trim($data['Degree'] ?? ''),
            'CivilStatus'          => trim($data['Civil Status'] ?? ''),
            'Birthdate'            => $birthdate,
            'ContactNo'            => trim($data['Contact No.'] ?? ''),
            'Email'                => trim(strtolower($data['Email'] ?? '')),
            'PresentAddress'       => trim($data['Present Address'] ?? ''),
            'PermanentAddress'     => trim($data['Permanent Address'] ?? ''),
            'EmerContactName'      => trim($data['Emergency Contact Name'] ?? ''),
            'EmerContactNo'        => trim($data['Emergency Contact No.'] ?? ''),
            'EmerRelationship'     => trim($data['Emergency Relationship'] ?? ''),
            'EmpStatus'            => trim($data['Employment Status'] ?? ''),
            'JobStatus'            => trim($data['Job Status'] ?? ''),
            'RankFile'             => trim($data['Rank/File'] ?? ''),
            'Department'           => trim($data['Department'] ?? ''),
            'Line'                 => trim($data['Line'] ?? ''),
            'Jobtitle'             => trim($data['Job Title'] ?? ''),
            'HiredDate'            => $hiredDate,
            'EndOfContract'        => $endOfContract,
            'pay_type'             => $payType,
            'payrate'              => is_numeric($data['Pay Rate'] ?? '')      ? floatval($data['Pay Rate'])      : 0,
            'pay_allowance'        => is_numeric($data['Pay Allowance'] ?? '') ? floatval($data['Pay Allowance']) : 0,
            'SSSNO'                => trim($data['SSS No.'] ?? ''),
            'PHILHEALTHNo'         => trim($data['PhilHealth No.'] ?? ''),
            'HDMFNo'               => trim($data['HDMF No.'] ?? ''),
            'TaxNo'                => trim($data['Tax No.'] ?? ''),
            'Taxable'              => $taxable,
            'CostCenter'           => trim($data['Cost Center'] ?? ''),
        ];
    }

    /**
     * Parse Excel date format into MySQL date
     * 
     * @param mixed $dateValue
     * @return string|null MySQL date format (Y-m-d) or null
     */
    protected function parseExcelDate($dateValue)
    {
        if (empty($dateValue)) {
            return null;
        }

        // If it's already a string date format, try to parse it
        if (is_string($dateValue)) {
            $timestamp = strtotime($dateValue);
            if ($timestamp !== false) {
                return date('Y-m-d', $timestamp);
            }
        }
        
        // If it's a numeric Excel date
        if (is_numeric($dateValue)) {
            try {
                return Date::excelToDateTimeObject($dateValue)->format('Y-m-d');
            } catch (\Exception $e) {
                // If Excel date conversion fails, return null
                return null;
            }
        }

        return null;
    }

    protected function getValidationRules()
    {
        return [
            'idno' => 'nullable|unique:employees,idno',
            'bid' => 'nullable',
            'Lname' => 'required|string|max:255',
            'Fname' => 'required|string|max:255',
            'Gender' => ['nullable', Rule::in(['Male', 'Female'])],
            'EducationalAttainment' => 'nullable|string|max:255',
            'CivilStatus' => ['nullable', Rule::in(['Single', 'Married', 'Divorced', 'Widowed'])],
            'Birthdate' => 'nullable|date',
            'ContactNo' => 'nullable|string|max:20',
            'Email' => 'nullable|email|max:255',
            'PresentAddress' => 'nullable|string|max:500',
            'PermanentAddress' => 'nullable|string|max:500',
            'EmerContactName' => 'nullable|string|max:255',
            'EmerContactNo' => 'nullable|string|max:20',
            'EmerRelationship' => 'nullable|string|max:255',
            'EmpStatus' => 'nullable|string|max:255',
            'JobStatus' => 'nullable|string|max:255',
            'RankFile' => 'nullable|string|max:255',
            'Department' => 'nullable|string|max:255',
            'Line' => 'nullable|string|max:255',
            'Jobtitle' => 'nullable|string|max:255',
            'HiredDate' => 'nullable|date',
            'EndOfContract' => 'nullable|date|after_or_equal:HiredDate',
            'pay_type' => ['required', Rule::in(['Monthly', 'Weekly', 'Daily'])],
            'payrate' => 'nullable|numeric|min:0',
            'pay_allowance' => 'nullable|numeric|min:0',
            'SSSNO' => 'nullable|string|max:20',
            'PHILHEALTHNo' => 'nullable|string|max:20',
            'HDMFNo' => 'nullable|string|max:20',
            'TaxNo' => 'nullable|string|max:20',
            'Taxable' => 'boolean',
            'CostCenter' => 'nullable|string|max:255'
        ];
    }

    public function downloadTemplate()
    {
        $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        // Add headers and format them
        foreach ($this->expectedHeaders as $index => $header) {
            $column = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($index + 1);
            $sheet->setCellValue($column . '1', $header);
            
            // Style the header row
            $sheet->getStyle($column . '1')->applyFromArray([
                'font' => ['bold' => true],
                'fill' => [
                    'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                    'color' => ['rgb' => 'E2E8F0']
                ]
            ]);
        }

        // Add example data for better user guidance
        $exampleData = [
            [
                'EMP001', 'BID001', 'Doe', 'John', 'Robert', '', 'Male',
                'College', 'BS Computer Science', 'Single', '1990-01-15',
                '1234567890', 'john.doe@example.com', '123 Main St', '123 Main St',
                'Jane Doe', '0987654321', 'Spouse',
                'Regular', 'Active', 'Staff', 'IT', 'Development',
                'Developer', '2022-01-01', '', 'Monthly',
                50000, 5000, '12-3456789-0', '12-345678901-2',
                '1234-5678-9', '123-456-789-000', 'Yes', 'IT001'
            ]
        ];

        // Add example data
        foreach ($exampleData as $rowIndex => $rowData) {
            foreach ($rowData as $colIndex => $value) {
                $column = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colIndex + 1);
                $sheet->setCellValue($column . ($rowIndex + 2), $value);
            }
        }

        // Add conditional formatting for required fields
        $requiredFields = array_keys(array_filter($this->getValidationRules(), function($rule) {
            return is_string($rule) && strpos($rule, 'required') !== false;
        }));

        foreach ($requiredFields as $fieldName) {
            $headerKey = array_search($fieldName, $this->expectedHeaders);
            if ($headerKey !== false) {
                $column = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($headerKey + 1);

                $currentValue = $sheet->getCell($column . '1')->getValue();
                $sheet->setCellValue($column . '1', $currentValue . ' *');

                $sheet->getStyle($column . '1')->applyFromArray([
                    'fill' => [
                        'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                        'color' => ['rgb' => 'FFDDDD']
                    ]
                ]);
            }
        }

        // Add drop-down lists for fields with specific allowed values
        $this->addDropdownValidation($sheet, 'Gender', ['Male', 'Female']);
        $this->addDropdownValidation($sheet, 'Civil Status', ['Single', 'Married', 'Divorced', 'Widowed']);
        $this->addDropdownValidation($sheet, 'Pay Type', ['Monthly', 'Weekly', 'Daily']);
        $this->addDropdownValidation($sheet, 'Taxable', ['Yes', 'No']);

        // Auto-size columns
        $highestColumn = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::columnIndexFromString($sheet->getHighestColumn());
        for ($col = 1; $col <= $highestColumn; $col++) {
            $columnLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($col);
            $sheet->getColumnDimension($columnLetter)->setAutoSize(true);
        }

        // Add a documentation sheet
        $docSheet = $spreadsheet->createSheet();
        $docSheet->setTitle('Instructions');
        $docSheet->setCellValue('A1', 'Employee Import Template Instructions');
        $docSheet->setCellValue('A3', '1. Fields marked with * are required.');
        $docSheet->setCellValue('A4', '2. Dates should be in YYYY-MM-DD format (e.g., 2022-01-15).');
        $docSheet->setCellValue('A5', '3. Gender must be either "Male" or "Female".');
        $docSheet->setCellValue('A6', '4. Civil Status must be one of: "Single", "Married", "Divorced", or "Widowed".');
        $docSheet->setCellValue('A7', '5. pay_type must be one of: "Monthly", "Weekly", or "Daily".');
        $docSheet->setCellValue('A8', '6. Taxable must be either TRUE or FALSE.');
        $docSheet->setCellValue('A9', '7. Email must be a valid email address.');
        $docSheet->setCellValue('A10', '8. Numeric fields like payrate should not contain currency symbols or commas.');
        
        // Style the instruction sheet
        $docSheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);
        $docSheet->getColumnDimension('A')->setWidth(100);
        
        // Set the Instructions sheet as the active one when opening
        $spreadsheet->setActiveSheetIndex(0);

        // Create the Excel file
        $writer = IOFactory::createWriter($spreadsheet, 'Xlsx');
        $filename = 'employee_import_template_' . date('Y-m-d') . '.xlsx';
        
        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment;filename="' . $filename . '"');
        header('Cache-Control: max-age=0');

        $writer->save('php://output');
    }
    
    /**
     * Add dropdown validation to a specific column
     *
     * @param \PhpOffice\PhpSpreadsheet\Worksheet\Worksheet $sheet
     * @param string $headerName
     * @param array $options
     */
    private function addDropdownValidation($sheet, $headerName, $options)
    {
        $headerIndex = array_search($headerName, $this->expectedHeaders);
        if ($headerIndex !== false) {
            $column = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($headerIndex + 1);
            
            // Set data validation for cells below header (rows 2-1000)
            $validation = $sheet->getCell($column . '2')->getDataValidation();
            $validation->setType(\PhpOffice\PhpSpreadsheet\Cell\DataValidation::TYPE_LIST);
            $validation->setErrorStyle(\PhpOffice\PhpSpreadsheet\Cell\DataValidation::STYLE_INFORMATION);
            $validation->setAllowBlank(true);
            $validation->setShowInputMessage(true);
            $validation->setShowErrorMessage(true);
            $validation->setShowDropDown(true);
            $validation->setErrorTitle('Input error');
            $validation->setError('Value is not in list.');
            $validation->setPromptTitle('Pick from list');
            $validation->setPrompt('Please select a value from the drop-down list.');
            $validation->setFormula1('"' . implode(',', $options) . '"');
            
            // Copy the validation to the range
            $sheet->setDataValidation($column . '2:' . $column . '1000', $validation);
        }
    }
}