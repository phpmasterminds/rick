import { NextRequest, NextResponse } from 'next/server';
import { DashboardService } from '@/services/DashboardService';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const businessId = searchParams.get('business_id');

    if (!businessId) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'business_id is required',
          data: null,
        },
        { status: 400 }
      );
    }

    const dashboardService = new DashboardService();
    const stats = await dashboardService.getAdminDashboard(businessId);

    return NextResponse.json({
      status: 'success',
      message: 'Admin dashboard data retrieved successfully',
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to fetch admin dashboard',
        data: null,
      },
      { status: 500 }
    );
  }
}