'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import axios from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    tenantName: '',
    slug: '',
    businessType: 'inventory',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      if (name === 'tenantName') {
        newData.slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      }
      return newData;
    });
  };

  const handleNext = () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setError('Please fill in all personal details');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tenantName || !formData.slug) {
      setError('Please fill in all business details');
      return;
    }
    
    setError('');
    setIsLoading(true);

    try {
      const response = await axios.post('/auth/register', formData);
      const { token, user, tenant } = response.data.data;
      setAuth(token, user, tenant);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-slate-900">
      <Card className="w-full max-w-lg border-none shadow-xl bg-white">
        <CardHeader className="text-center space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">Create Account</CardTitle>
          <CardDescription>
            {step === 1 ? 'Step 1: Personal Information' : 'Step 2: Business Details'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={step === 2 ? handleSubmit : (e) => e.preventDefault()} className="space-y-4">
            {error && (
              <div className="p-3 rounded-md bg-red-50 text-red-600 border border-red-100 text-sm">
                {error}
              </div>
            )}

            {step === 1 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <Button type="button" onClick={handleNext} className="w-full bg-slate-900 hover:bg-slate-800 text-white">
                  Next: Business Details
                </Button>
              </>
            )}

            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="tenantName">Business Name</Label>
                  <Input
                    id="tenantName"
                    name="tenantName"
                    value={formData.tenantName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Store URL Slug</Label>
                  <div className="flex items-center">
                    <span className="text-sm text-slate-500 mr-2">app.domain.com/</span>
                    <Input
                      id="slug"
                      name="slug"
                      value={formData.slug}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessType">Business Type</Label>
                  <select 
                    id="businessType"
                    name="businessType"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.businessType}
                    onChange={handleInputChange}
                  >
                    <option value="inventory">Inventory Management</option>
                    <option value="hotel">Hotel & Restaurant</option>
                    <option value="finance">Personal Finance</option>
                    <option value="ecommerce">E-commerce Store</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="w-1/3">
                    Back
                  </Button>
                  <Button type="submit" className="w-2/3 bg-slate-900 hover:bg-slate-800 text-white" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      'Complete Setup'
                    )}
                  </Button>
                </div>
              </>
            )}
          </form>
          <div className="mt-4 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <a href="/auth/login" className="text-slate-900 hover:underline font-medium">
              Login
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
