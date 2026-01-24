'use client';

import { usePlans, usePlanActions } from '@/hooks/use-plans';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus, Trash2, Check, CreditCard } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function PlansPage() {
  const { data: plans, isLoading } = usePlans();
  const { createPlan, updatePlan, deletePlan, isCreating, isUpdating } = usePlanActions();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // simple form state
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    price: '',
    billingCycle: 'monthly',
  });

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ name: '', displayName: '', price: '', billingCycle: 'monthly' });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (plan: any) => {
    setEditingId(plan.id);
    setFormData({
      name: plan.name,
      displayName: plan.displayName,
      price: plan.price.toString(),
      billingCycle: plan.billingCycle,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        features: {} // Placeholder for features JSON
      };

      if (editingId) {
        await updatePlan({ id: editingId, data: payload });
      } else {
        await createPlan(payload);
      }
      
      setIsDialogOpen(false);
      setFormData({ name: '', displayName: '', price: '', billingCycle: 'monthly' });
      setEditingId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure? This cannot be undone.')) {
      try {
        await deletePlan(id);
      } catch (err) {
        alert('Failed to delete plan. Ensure no tenants are using it.');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Subscription Plans</h2>
          <p className="text-gray-500">Manage pricing tiers and feature limits.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-slate-900 text-white hover:bg-slate-800" onClick={handleOpenCreate}>
              <Plus className="mr-2 h-4 w-4" /> Create Plan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Plan' : 'Create New Plan'}</DialogTitle>
              <DialogDescription>
                {editingId ? 'Update existing subscription tier details.' : 'Define a new subscription tier for your tenants.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Internal Name</Label>
                  <Input 
                    placeholder="e.g. basic-monthly" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Display Name</Label>
                  <Input 
                    placeholder="e.g. Basic Plan" 
                    value={formData.displayName}
                    onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price</Label>
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Billing Cycle</Label>
                  <Select 
                    value={formData.billingCycle} 
                    onValueChange={(val) => setFormData({...formData, billingCycle: val})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={!formData.name || !formData.price || isCreating || isUpdating}>
                {(isCreating || isUpdating) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (editingId ? 'Update Plan' : 'Create Plan')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans?.map((plan: any) => (
          <Card key={plan.id} className="flex flex-col relative group">
            <CardHeader>
              <div className="flex justify-between items-start">
                <Badge variant="outline" className="capitalize">{plan.billingCycle}</Badge>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-blue-600" onClick={() => handleOpenEdit(plan)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                  </Button>
                  {plan._count?.tenants > 0 ? (
                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none ml-2">
                      {plan._count.tenants} Active
                    </Badge>
                  ) : (
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-red-500" onClick={() => handleDelete(plan.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <CardTitle className="text-2xl font-bold mt-2">{plan.displayName}</CardTitle>
              <CardDescription>
                <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                <span className="text-gray-500"> / {plan.billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Check className="mr-2 h-4 w-4 text-emerald-500" />
                  <span>Full Platform Access</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Check className="mr-2 h-4 w-4 text-emerald-500" />
                  <span>{plan.name === 'enterprise' ? 'Unlimited' : 'Standard'} Support</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-gray-50/50 border-t p-4">
              <div className="text-xs text-gray-500 w-full text-center font-mono">
                ID: {plan.id.slice(0, 8)}...
              </div>
            </CardFooter>
          </Card>
        ))}
        
        {(!plans || plans.length === 0) && (
          <div className="col-span-full text-center py-12 bg-gray-50 border border-dashed rounded-lg">
            <CreditCard className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900">No Plans Defined</h3>
            <p className="text-gray-500 mt-1">Get started by creating your first subscription tier.</p>
          </div>
        )}
      </div>
    </div>
  );
}
