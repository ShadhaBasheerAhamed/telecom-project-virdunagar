import type { 
  RevenueData, 
  PaymentModeDistribution, 
  CustomerGrowthData, 
  PlanDistribution,
  DashboardMetrics 
} from '../types';

// Chart configuration constants
export const CHART_COLORS = {
  primary: '#3B82F6',
  secondary: '#10B981',
  accent: '#F59E0B',
  danger: '#EF4444',
  warning: '#F59E0B',
  info: '#06B6D4',
  success: '#10B981',
  gray: '#6B7280',
  lightGray: '#F3F4F6'
};

export const CHART_GRADIENTS = {
  blue: ['#3B82F6', '#1E40AF'],
  green: ['#10B981', '#047857'],
  orange: ['#F59E0B', '#D97706'],
  red: ['#EF4444', '#DC2626'],
  purple: ['#8B5CF6', '#7C3AED'],
  indigo: ['#6366F1', '#4F46E5']
};

// Transform revenue data for chart consumption
export const transformRevenueData = (data: RevenueData[]) => {
  return {
    labels: data.map(item => item.month),
    datasets: [
      {
        label: 'Revenue',
        data: data.map(item => item.revenue),
        backgroundColor: CHART_GRADIENTS.blue[0] + '20',
        borderColor: CHART_GRADIENTS.blue[0],
        borderWidth: 2,
        fill: true,
        tension: 0.4
      },
      {
        label: 'Customers',
        data: data.map(item => item.customers),
        backgroundColor: CHART_GRADIENTS.green[0] + '20',
        borderColor: CHART_GRADIENTS.green[0],
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        yAxisID: 'y1'
      }
    ]
  };
};

// Transform payment mode distribution for pie/doughnut charts
export const transformPaymentModeData = (data: PaymentModeDistribution[]) => {
  const colors = [
    CHART_COLORS.primary,
    CHART_COLORS.secondary,
    CHART_COLORS.accent,
    CHART_COLORS.danger,
    CHART_COLORS.info,
    CHART_COLORS.warning
  ];

  return {
    labels: data.map(item => item.mode),
    datasets: [
      {
        data: data.map(item => item.count),
        backgroundColor: colors.slice(0, data.length),
        borderColor: colors.slice(0, data.length).map(color => color + '40'),
        borderWidth: 2,
        hoverBorderWidth: 3
      }
    ]
  };
};

// Transform customer growth data for line charts
export const transformCustomerGrowthData = (data: CustomerGrowthData[]) => {
  return {
    labels: data.map(item => new Date(item.date).toLocaleDateString('en-IN', { 
      month: 'short', 
      day: 'numeric' 
    })),
    datasets: [
      {
        label: 'Total Customers',
        data: data.map(item => item.totalCustomers),
        borderColor: CHART_COLORS.primary,
        backgroundColor: CHART_GRADIENTS.blue[0] + '20',
        borderWidth: 3,
        fill: true,
        tension: 0.4
      },
      {
        label: 'Active Customers',
        data: data.map(item => item.activeCustomers),
        borderColor: CHART_COLORS.success,
        backgroundColor: CHART_GRADIENTS.green[0] + '20',
        borderWidth: 2,
        fill: false,
        tension: 0.4
      },
      {
        label: 'New Customers',
        data: data.map(item => item.newCustomers),
        borderColor: CHART_COLORS.accent,
        backgroundColor: CHART_GRADIENTS.orange[0] + '20',
        borderWidth: 2,
        fill: false,
        tension: 0.4
      }
    ]
  };
};

// Transform plan distribution data for charts
export const transformPlanDistributionData = (data: PlanDistribution[]) => {
  return {
    labels: data.map(item => item.plan),
    datasets: [
      {
        data: data.map(item => item.customerCount),
        backgroundColor: [
          CHART_COLORS.primary,
          CHART_COLORS.secondary,
          CHART_COLORS.accent,
          CHART_COLORS.info,
          CHART_COLORS.warning,
          CHART_COLORS.success
        ].slice(0, data.length),
        borderWidth: 2,
        hoverBorderWidth: 3
      }
    ]
  };
};

// Create metrics cards data transformation
export const transformMetricsData = (metrics: DashboardMetrics) => {
  return [
    {
      title: 'Total Customers',
      value: metrics.totalCustomers.toLocaleString(),
      change: calculatePercentageChange(metrics.totalCustomers, metrics.newCustomersThisMonth),
      changeType: 'positive' as const,
      icon: 'users',
      color: CHART_COLORS.primary
    },
    {
      title: 'Monthly Revenue',
      value: `₹${(metrics.monthlyRevenue / 100000).toFixed(1)}L`,
      change: calculatePercentageChange(metrics.monthlyRevenue, metrics.totalRevenue - metrics.monthlyRevenue),
      changeType: 'positive' as const,
      icon: 'rupee',
      color: CHART_COLORS.success
    },
    {
      title: 'Active Customers',
      value: metrics.activeCustomers.toLocaleString(),
      change: calculatePercentageChange(metrics.activeCustomers, metrics.inactiveCustomers),
      changeType: 'positive' as const,
      icon: 'activity',
      color: CHART_COLORS.info
    },
    {
      title: 'Conversion Rate',
      value: `${metrics.conversionRate.toFixed(1)}%`,
      change: metrics.conversionRate > 10 ? 'Good Performance' : 'Needs Improvement',
      changeType: metrics.conversionRate > 10 ? 'positive' as const : 'negative' as const,
      icon: 'trending-up',
      color: CHART_COLORS.accent
    }
  ];
};

// Helper function to calculate percentage change
const calculatePercentageChange = (current: number, previous: number): string => {
  if (previous === 0) return 'N/A';
  const change = ((current - previous) / previous) * 100;
  return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
};

// Format chart data for different chart types
export const formatChartData = {
  bar: (data: any[], xField: string, yField: string) => {
    return {
      labels: data.map(item => item[xField]),
      datasets: [
        {
          label: yField,
          data: data.map(item => item[yField]),
          backgroundColor: CHART_COLORS.primary + '80',
          borderColor: CHART_COLORS.primary,
          borderWidth: 1
        }
      ]
    };
  },

  line: (data: any[], xField: string, yField: string, label: string = yField) => {
    return {
      labels: data.map(item => item[xField]),
      datasets: [
        {
          label,
          data: data.map(item => item[yField]),
          borderColor: CHART_COLORS.primary,
          backgroundColor: CHART_COLORS.primary + '20',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }
      ]
    };
  },

  pie: (data: any[], labelField: string, valueField: string, colors?: string[]) => {
    return {
      labels: data.map(item => item[labelField]),
      datasets: [
        {
          data: data.map(item => item[valueField]),
          backgroundColor: colors || [
            CHART_COLORS.primary,
            CHART_COLORS.secondary,
            CHART_COLORS.accent,
            CHART_COLORS.danger,
            CHART_COLORS.info,
            CHART_COLORS.warning
          ].slice(0, data.length),
          borderWidth: 2
        }
      ]
    };
  }
};

// Chart configuration templates
export const CHART_CONFIGS = {
  revenue: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ₹${context.parsed.y?.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Month'
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Revenue (₹)'
        },
        ticks: {
          callback: function(value: any) {
            return '₹' + (value / 1000).toFixed(0) + 'K';
          }
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Customers'
        },
        grid: {
          drawOnChartArea: false,
        },
      }
    }
  },

  customers: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Date'
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Customers'
        }
      }
    }
  },

  distribution: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  }
};