import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last Updated: October 2025</p>

        <Card>
          <CardContent className="prose prose-sm max-w-none pt-6 space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-3">1. Introduction</h2>
              <p>
                Nkani Business Solutions (Pty) Ltd ("we", "us", or "our") is committed to protecting your 
                privacy and ensuring the security of your personal information. This Privacy Policy explains 
                how we collect, use, disclose, and safeguard your information in compliance with the Protection 
                of Personal Information Act, 2013 (POPIA) of South Africa.
              </p>
              <p>
                By using the BizCounting platform ("Service"), you consent to the data practices described 
                in this policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">2. Information We Collect</h2>
              <h3 className="text-xl font-semibold mb-2">2.1 Personal Information</h3>
              <p>We collect the following types of personal information:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Account Information:</strong> Name, email address, phone number, company name</li>
                <li><strong>Business Information:</strong> Company registration details, tax numbers, financial data</li>
                <li><strong>Employee Information:</strong> Names, ID numbers, contact details, employment details, salary information, bank account details (when using payroll features)</li>
                <li><strong>Financial Data:</strong> Transaction records, invoices, expenses, payment information</li>
                <li><strong>Usage Data:</strong> IP address, browser type, device information, access times</li>
              </ul>

              <h3 className="text-xl font-semibold mb-2 mt-4">2.2 How We Collect Information</h3>
              <p>We collect information through:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Direct input when you register and use the Service</li>
                <li>Automatic collection through cookies and similar technologies</li>
                <li>Communications with our customer support team</li>
                <li>Integration with third-party services (with your consent)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">3. Purpose of Processing</h2>
              <p>We process your personal information for the following purposes:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Providing and maintaining the Service</li>
                <li>Processing transactions and generating financial documents</li>
                <li>Managing payroll and employee records</li>
                <li>Communicating with you about the Service</li>
                <li>Improving and personalizing your experience</li>
                <li>Complying with legal and regulatory requirements</li>
                <li>Preventing fraud and ensuring security</li>
                <li>Providing customer support</li>
                <li>Delivering professional accounting services (when engaged)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">4. Legal Basis for Processing</h2>
              <p>Under POPIA, we process your personal information based on:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Consent:</strong> You have given explicit consent for specific processing purposes</li>
                <li><strong>Contractual Necessity:</strong> Processing is necessary to provide the Service</li>
                <li><strong>Legal Obligation:</strong> Processing is required to comply with South African law</li>
                <li><strong>Legitimate Interest:</strong> Processing is necessary for our legitimate business interests</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">5. Information Sharing and Disclosure</h2>
              <h3 className="text-xl font-semibold mb-2">5.1 Third-Party Service Providers</h3>
              <p>
                We may share your information with trusted third-party service providers who assist us in 
                operating the Service, including:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Cloud hosting and infrastructure providers</li>
                <li>Payment processing services</li>
                <li>Analytics and monitoring services</li>
                <li>Customer support tools</li>
              </ul>

              <h3 className="text-xl font-semibold mb-2 mt-4">5.2 Legal Requirements</h3>
              <p>
                We may disclose your information when required by law, court order, or governmental authority, 
                or to protect our rights, property, or safety.
              </p>

              <h3 className="text-xl font-semibold mb-2 mt-4">5.3 Business Transfers</h3>
              <p>
                In the event of a merger, acquisition, or sale of assets, your information may be transferred 
                to the acquiring entity, subject to the same privacy protections.
              </p>

              <h3 className="text-xl font-semibold mb-2 mt-4">5.4 No Selling of Personal Information</h3>
              <p>
                We do not sell, rent, or trade your personal information to third parties for marketing purposes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">6. Data Security</h2>
              <p>
                We implement appropriate technical and organisational measures to protect your personal 
                information against unauthorized access, alteration, disclosure, or destruction, including:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security assessments and updates</li>
                <li>Access controls and authentication mechanisms</li>
                <li>Secure data centers and infrastructure</li>
                <li>Employee training on data protection</li>
                <li>Incident response and breach notification procedures</li>
              </ul>
              <p className="mt-3">
                While we strive to protect your personal information, no method of transmission over the 
                internet or electronic storage is 100% secure. We cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">7. Data Retention</h2>
              <p>
                We retain your personal information for as long as necessary to fulfill the purposes outlined 
                in this Privacy Policy, unless a longer retention period is required or permitted by law.
              </p>
              <p>
                Financial records and employee data may be retained for periods required by South African 
                tax and labour laws (typically 5-7 years). When data is no longer needed, we securely delete 
                or anonymize it.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">8. Your Rights Under POPIA</h2>
              <p>As a data subject, you have the following rights:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Right to Access:</strong> Request confirmation of whether we process your personal information and access to that information</li>
                <li><strong>Right to Correction:</strong> Request correction of inaccurate or incomplete personal information</li>
                <li><strong>Right to Deletion:</strong> Request deletion of your personal information (subject to legal retention requirements)</li>
                <li><strong>Right to Object:</strong> Object to the processing of your personal information</li>
                <li><strong>Right to Data Portability:</strong> Request a copy of your personal information in a structured, commonly used format</li>
                <li><strong>Right to Withdraw Consent:</strong> Withdraw your consent at any time (where processing is based on consent)</li>
                <li><strong>Right to Lodge a Complaint:</strong> Lodge a complaint with the Information Regulator of South Africa</li>
              </ul>
              <p className="mt-3">
                To exercise any of these rights, please contact us using the details provided in Section 13.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">9. Cookies and Tracking Technologies</h2>
              <p>
                We use cookies and similar tracking technologies to enhance your experience, analyze usage 
                patterns, and improve the Service. Cookies are small data files stored on your device.
              </p>
              
              <h3 className="text-xl font-semibold mb-2 mt-4">Types of Cookies We Use:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Essential Cookies:</strong> Required for the Service to function properly</li>
                <li><strong>Analytical Cookies:</strong> Help us understand how users interact with the Service</li>
                <li><strong>Functional Cookies:</strong> Remember your preferences and settings</li>
              </ul>
              <p className="mt-3">
                You can control cookies through your browser settings. However, disabling cookies may affect 
                the functionality of the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">10. International Data Transfers</h2>
              <p>
                Your information may be transferred to and processed in countries outside of South Africa. 
                We ensure that such transfers comply with POPIA requirements and that adequate safeguards 
                are in place to protect your personal information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">11. Children's Privacy</h2>
              <p>
                The Service is not intended for individuals under the age of 18. We do not knowingly collect 
                personal information from children. If you become aware that a child has provided us with 
                personal information, please contact us, and we will take steps to delete such information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">12. Changes to This Privacy Policy</h2>
              <p>
                We may update this Privacy Policy from time to time to reflect changes in our practices or 
                legal requirements. We will notify you of material changes by posting the updated policy on 
                the Service and updating the "Last Updated" date.
              </p>
              <p>
                Your continued use of the Service after changes become effective constitutes acceptance of 
                the revised Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">13. Contact Information</h2>
              <p>
                If you have questions about this Privacy Policy or wish to exercise your rights, please contact:
              </p>
              <div className="mt-3">
                <p><strong>Information Officer</strong></p>
                <p>Nkani Business Solutions (Pty) Ltd</p>
                <p>Email: privacy@bizcounting.co.za</p>
                <p>Address: [Physical Address]</p>
                <p>Registration Number: [Company Registration Number]</p>
              </div>
              <p className="mt-3">
                <strong>Information Regulator of South Africa:</strong><br />
                JD House, 27 Stiemens Street, Braamfontein, Johannesburg, 2001<br />
                P.O Box 31533, Braamfontein, Johannesburg, 2017<br />
                Email: inforeg@justice.gov.za
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">14. Consent</h2>
              <p>
                By using the BizCounting platform, you acknowledge that you have read and understood this 
                Privacy Policy and consent to the collection, use, and disclosure of your personal information 
                as described herein.
              </p>
            </section>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
