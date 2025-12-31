import { NextRequest, NextResponse } from 'next/server';
import { DashboardService } from '@/services/DashboardService';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'user_id is required',
          data: null,
        },
        { status: 400 }
      );
    }

    const dashboardService = new DashboardService();
    const stats = await dashboardService.getBuyerDashboard(userId);

    return NextResponse.json({
      status: 'success',
      message: 'Buyer dashboard data retrieved successfully',
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching buyer dashboard:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to fetch buyer dashboard',
        data: null,
      },
      { status: 500 }
    );
  }
}