import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

export default function TermsAndConditions() {
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
        <h1 className="text-4xl font-bold mb-2">Terms and Conditions</h1>
        <p className="text-muted-foreground mb-8">Last Updated: October 2025</p>

        <Card>
          <CardContent className="prose prose-sm max-w-none pt-6 space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-3">1. Introduction</h2>
              <p>
                These Terms and Conditions ("Terms") govern your use of the BizCounting platform ("Service") 
                provided by Nkani Business Solutions (Pty) Ltd (Registration Number: [Registration Number]), 
                a company registered in the Republic of South Africa ("Company", "we", "us", or "our").
              </p>
              <p>
                By accessing or using our Service, you agree to be bound by these Terms. If you disagree with 
                any part of these Terms, you may not access the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">2. Definitions</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>"Service"</strong> refers to the BizCounting platform, including all features, tools, and functionalities.</li>
                <li><strong>"User"</strong> refers to any individual or entity accessing or using the Service.</li>
                <li><strong>"Content"</strong> refers to data, information, text, graphics, or other materials uploaded by Users.</li>
                <li><strong>"Professional Services"</strong> refers to optional accounting and business advisory services offered by the Company.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">3. Service Description</h2>
              <p>
                BizCounting provides a comprehensive business management platform offering:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Accounting and financial management tools</li>
                <li>Payroll and HR management systems</li>
                <li>Inventory tracking and management</li>
                <li>Invoice and quote generation</li>
                <li>Financial reporting and analytics</li>
                <li>Optional professional accounting services (separate agreement required)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">4. User Accounts</h2>
              <h3 className="text-xl font-semibold mb-2">4.1 Registration</h3>
              <p>
                To use certain features of the Service, you must register for an account. You agree to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain and update your information to keep it accurate and current</li>
                <li>Maintain the security and confidentiality of your password</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
              </ul>

              <h3 className="text-xl font-semibold mb-2 mt-4">4.2 Account Responsibility</h3>
              <p>
                You are responsible for all activities that occur under your account. You must be at least 18 
                years old and legally capable of entering into binding contracts under South African law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">5. Acceptable Use</h2>
              <p>You agree not to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Use the Service for any illegal purpose or in violation of any laws</li>
                <li>Upload or transmit viruses, malware, or other malicious code</li>
                <li>Attempt to gain unauthorized access to the Service or related systems</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Use the Service to transmit spam or unsolicited communications</li>
                <li>Impersonate any person or entity or misrepresent your affiliation</li>
                <li>Violate any intellectual property rights</li>
                <li>Collect or store personal data of other Users without consent</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">6. Pricing and Payment</h2>
              <h3 className="text-xl font-semibold mb-2">6.1 Free Service</h3>
              <p>
                The core BizCounting platform is provided free of charge to all Users. We reserve the right 
                to modify or discontinue the free Service at any time with reasonable notice.
              </p>

              <h3 className="text-xl font-semibold mb-2 mt-4">6.2 Professional Services</h3>
              <p>
                Optional professional accounting services are available at custom rates based on your business 
                needs. These services require a separate service agreement and are subject to additional terms 
                and pricing schedules.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">7. Intellectual Property</h2>
              <h3 className="text-xl font-semibold mb-2">7.1 Company Rights</h3>
              <p>
                The Service, including all content, features, and functionality, is owned by Nkani Business 
                Solutions (Pty) Ltd and is protected by South African and international copyright, trademark, 
                and other intellectual property laws.
              </p>

              <h3 className="text-xl font-semibold mb-2 mt-4">7.2 User Content</h3>
              <p>
                You retain all rights to the content you upload to the Service. By uploading content, you grant 
                us a non-exclusive, worldwide, royalty-free license to use, store, and process your content solely 
                for the purpose of providing the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">8. Data Protection and Privacy</h2>
              <p>
                We are committed to protecting your privacy in accordance with the Protection of Personal 
                Information Act (POPIA) of South Africa. Our collection, use, and disclosure of your personal 
                information is governed by our Privacy Policy, which forms part of these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">9. Disclaimers and Limitations of Liability</h2>
              <h3 className="text-xl font-semibold mb-2">9.1 Service "As Is"</h3>
              <p>
                The Service is provided "as is" and "as available" without warranties of any kind, either express 
                or implied. We do not warrant that the Service will be uninterrupted, secure, or error-free.
              </p>

              <h3 className="text-xl font-semibold mb-2 mt-4">9.2 No Professional Advice</h3>
              <p>
                The Service provides tools and information but does not constitute professional accounting, 
                legal, or tax advice. You should consult with qualified professionals for specific advice 
                related to your business.
              </p>

              <h3 className="text-xl font-semibold mb-2 mt-4">9.3 Limitation of Liability</h3>
              <p>
                To the maximum extent permitted by South African law, Nkani Business Solutions (Pty) Ltd 
                shall not be liable for any indirect, incidental, special, consequential, or punitive damages, 
                or any loss of profits or revenues, whether incurred directly or indirectly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">10. Indemnification</h2>
              <p>
                You agree to indemnify and hold harmless Nkani Business Solutions (Pty) Ltd, its officers, 
                directors, employees, and agents from any claims, damages, losses, liabilities, and expenses 
                arising from your use of the Service or violation of these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">11. Termination</h2>
              <p>
                We may terminate or suspend your account and access to the Service immediately, without prior 
                notice or liability, for any reason, including breach of these Terms. Upon termination, your 
                right to use the Service will immediately cease.
              </p>
              <p>
                You may terminate your account at any time by contacting us or using the account deletion 
                feature in the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">12. Governing Law and Dispute Resolution</h2>
              <h3 className="text-xl font-semibold mb-2">12.1 Governing Law</h3>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the Republic of 
                South Africa, without regard to its conflict of law provisions.
              </p>

              <h3 className="text-xl font-semibold mb-2 mt-4">12.2 Dispute Resolution</h3>
              <p>
                Any dispute arising from these Terms shall first be subject to good faith negotiations between 
                the parties. If the dispute cannot be resolved through negotiation, it shall be submitted to 
                arbitration in accordance with the Arbitration Act 42 of 1965, or its successor legislation.
              </p>

              <h3 className="text-xl font-semibold mb-2 mt-4">12.3 Jurisdiction</h3>
              <p>
                The parties submit to the non-exclusive jurisdiction of the South African courts for any 
                proceedings arising from these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">13. Changes to Terms</h2>
              <p>
                We reserve the right to modify these Terms at any time. We will provide notice of material 
                changes by posting the updated Terms on the Service and updating the "Last Updated" date. 
                Your continued use of the Service after changes become effective constitutes acceptance of 
                the revised Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">14. Contact Information</h2>
              <p>
                For questions about these Terms, please contact us at:
              </p>
              <p className="mt-2">
                <strong>Nkani Business Solutions (Pty) Ltd</strong><br />
                Email: legal@bizcounting.co.za<br />
                Address: [Physical Address]<br />
                Registration Number: [Company Registration Number]
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">15. General Provisions</h2>
              <h3 className="text-xl font-semibold mb-2">15.1 Entire Agreement</h3>
              <p>
                These Terms, together with our Privacy Policy, constitute the entire agreement between you 
                and Nkani Business Solutions (Pty) Ltd regarding the Service.
              </p>

              <h3 className="text-xl font-semibold mb-2 mt-4">15.2 Severability</h3>
              <p>
                If any provision of these Terms is found to be unenforceable or invalid, that provision shall 
                be limited or eliminated to the minimum extent necessary, and the remaining provisions shall 
                remain in full force and effect.
              </p>

              <h3 className="text-xl font-semibold mb-2 mt-4">15.3 Waiver</h3>
              <p>
                No waiver of any term of these Terms shall be deemed a further or continuing waiver of such 
                term or any other term.
              </p>
            </section>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
