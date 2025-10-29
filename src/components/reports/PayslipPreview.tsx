import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface PayslipPreviewProps {
  payrollRecord: any;
  companySettings: any;
}

export function PayslipPreview({ payrollRecord, companySettings }: PayslipPreviewProps) {
  const employee = payrollRecord.employees || {};
  const currencySymbol = payrollRecord.currency_symbol || 'R';

  const earnings = [
    { label: 'Basic Salary', amount: payrollRecord.basic_salary || 0 },
    { label: 'Allowances', amount: payrollRecord.allowances || 0 },
    { label: 'Overtime', amount: payrollRecord.overtime || 0 },
    { label: 'Bonuses', amount: payrollRecord.bonuses || 0 },
  ].filter(item => item.amount > 0);

  const deductions = [
    { label: 'PAYE', amount: payrollRecord.paye || 0 },
    { label: 'UIF', amount: payrollRecord.uif || 0 },
    { label: 'Other Deductions', amount: payrollRecord.other_deductions || 0 },
  ].filter(item => item.amount > 0);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold">PAYSLIP</h2>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div>
          <h3 className="font-bold mb-2">Company Details</h3>
          <div className="text-sm space-y-1">
            <p className="font-semibold">{companySettings.company_name}</p>
            <p>{companySettings.address}</p>
            <p>{companySettings.email}</p>
            <p>{companySettings.phone}</p>
          </div>
        </div>
        <div>
          <h3 className="font-bold mb-2">Employee Details</h3>
          <div className="text-sm space-y-1">
            <p><strong>Employee #:</strong> {employee.employee_number}</p>
            <p><strong>Name:</strong> {employee.first_name} {employee.last_name}</p>
            <p><strong>ID Number:</strong> {employee.id_number}</p>
            <p><strong>Position:</strong> {employee.position}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 bg-gray-100 p-4 rounded">
        <div>
          <p className="text-sm text-gray-600">Pay Period Start</p>
          <p className="font-semibold">{payrollRecord.period_start}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Pay Period End</p>
          <p className="font-semibold">{payrollRecord.period_end}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Payment Date</p>
          <p className="font-semibold">{payrollRecord.period_end}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="font-bold mb-3 text-lg">Earnings</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {earnings.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell>{item.label}</TableCell>
                  <TableCell className="text-right">{currencySymbol}{item.amount.toFixed(2)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="font-bold bg-gray-100">
                <TableCell>Gross Salary</TableCell>
                <TableCell className="text-right">{currencySymbol}{payrollRecord.gross_salary?.toFixed(2)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <div>
          <h3 className="font-bold mb-3 text-lg">Deductions</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deductions.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell>{item.label}</TableCell>
                  <TableCell className="text-right">{currencySymbol}{item.amount.toFixed(2)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="font-bold bg-gray-100">
                <TableCell>Total Deductions</TableCell>
                <TableCell className="text-right">{currencySymbol}{payrollRecord.total_deductions?.toFixed(2)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="bg-primary text-primary-foreground p-4 rounded text-center">
        <p className="text-sm mb-1">NET PAY</p>
        <p className="text-3xl font-bold">{currencySymbol}{payrollRecord.net_salary?.toFixed(2)}</p>
      </div>

      {employee.bank_name && (
        <div>
          <h3 className="font-bold mb-2">Banking Details</h3>
          <div className="text-sm space-y-1 bg-gray-50 p-3 rounded">
            <p><strong>Bank:</strong> {employee.bank_name}</p>
            <p><strong>Account Number:</strong> {employee.bank_account_number}</p>
            <p><strong>Account Type:</strong> {employee.bank_account_type}</p>
          </div>
        </div>
      )}

      {payrollRecord.notes && (
        <div>
          <h3 className="font-bold mb-2">Notes</h3>
          <p className="text-sm bg-gray-50 p-3 rounded">{payrollRecord.notes}</p>
        </div>
      )}

      <div className="text-center text-xs text-gray-500 mt-8 pt-4 border-t">
        This is a computer-generated payslip and does not require a signature.
      </div>
    </div>
  );
}
