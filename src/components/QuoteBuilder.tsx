import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Navigation } from './Navigation';
import { ProjectDetailsForm } from './quote/ProjectDetailsForm';
import { LineItemsForm } from './quote/LineItemsForm';
import { QuotePreview } from './quote/QuotePreview';
import { Quote, ProjectDetails, IndustrySpecificFields, LineItem } from '@/types/quote';
import { loadSettings } from '@/utils/settingsStorage';

export const QuoteBuilder = () => {
  const settings = loadSettings();
  const [activeTab, setActiveTab] = useState('details');
  const [projectDetails, setProjectDetails] = useState<ProjectDetails>({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    projectName: '',
    projectAddress: '',
    industry: 'construction',
    startDate: '',
    estimatedDuration: '',
    additionalNotes: '',
  });
  
  const [industryFields, setIndustryFields] = useState<IndustrySpecificFields>({});
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  
  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const taxRate = settings.taxRate;
  const taxAmount = subtotal * taxRate;
  const discount = 0;
  const total = subtotal + taxAmount - discount;
  
  const currentQuote: Quote = {
    id: crypto.randomUUID(),
    projectDetails,
    industryFields,
    lineItems,
    subtotal,
    taxRate,
    taxAmount,
    discount,
    total,
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent mb-2">
            Quote Builder
          </h1>
          <p className="text-muted-foreground text-lg">
            Create professional quotes and bills of materials
          </p>
        </div>

        <Card className="shadow-[var(--shadow-elegant)] border-border/50 backdrop-blur-sm bg-card/80">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-muted/50">
              <TabsTrigger value="details" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Project Details
              </TabsTrigger>
              <TabsTrigger value="items" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Line Items
              </TabsTrigger>
              <TabsTrigger value="preview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Preview & Export
              </TabsTrigger>
            </TabsList>

            <div className="p-6">
              <TabsContent value="details" className="mt-0">
                <ProjectDetailsForm
                  projectDetails={projectDetails}
                  industryFields={industryFields}
                  onProjectDetailsChange={setProjectDetails}
                  onIndustryFieldsChange={setIndustryFields}
                  onNext={() => setActiveTab('items')}
                />
              </TabsContent>

              <TabsContent value="items" className="mt-0">
                <LineItemsForm
                  lineItems={lineItems}
                  industry={projectDetails.industry}
                  onLineItemsChange={setLineItems}
                  onNext={() => setActiveTab('preview')}
                  onBack={() => setActiveTab('details')}
                />
              </TabsContent>

              <TabsContent value="preview" className="mt-0">
                <QuotePreview
                  quote={currentQuote}
                  onBack={() => setActiveTab('items')}
                />
              </TabsContent>
            </div>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};
