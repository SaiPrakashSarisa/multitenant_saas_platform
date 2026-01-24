'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Eye, Ban, RotateCw } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

interface TenantsTableProps {
  data: any[];
  isLoading: boolean;
}

export function TenantsTable({ data, isLoading }: TenantsTableProps) {
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center border rounded-md bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tenant Name</TableHead>
            <TableHead>Business Type</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No tenants found.
              </TableCell>
            </TableRow>
          ) : (
            data.map((tenant: any) => (
              <TableRow key={tenant.id}>
                <TableCell className="font-medium">
                  <div>{tenant.name}</div>
                  <div className="text-xs text-muted-foreground">{tenant.slug}</div>
                </TableCell>
                <TableCell className="capitalize">{tenant.businessType}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {tenant.plan?.displayName || 'No Plan'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={tenant.status === 'active' ? 'default' : 'secondary'}
                    className={
                      tenant.status === 'active' ? 'bg-emerald-500 hover:bg-emerald-600' : 
                      tenant.status === 'suspended' ? 'bg-red-500 hover:bg-red-600' : ''
                    }
                  >
                    {tenant.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(tenant.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <Link href={`/admin/tenants/${tenant.id}`}>
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                      </Link>
                      {tenant.status === 'active' ? (
                        <DropdownMenuItem className="text-red-600">
                          <Ban className="mr-2 h-4 w-4" /> Suspend Tenant
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem className="text-emerald-600">
                          <RotateCw className="mr-2 h-4 w-4" /> Activate Tenant
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
