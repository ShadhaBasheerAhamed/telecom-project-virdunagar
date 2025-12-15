// Sample data for expired_overview collection
export const sampleExpiredOverviewData = [
  // Recent expirations (within current month)
  {
    id: 'exp001',
    customerId: 'cust001',
    customerName: 'RAJESH KUMAR',
    planType: 'Broadband Basic',
    expiredDate: '2025-12-10',
    reason: 'service_ended',
    source: 'BSNL',
    createdAt: '2025-12-10T10:30:00.000Z'
  },
  {
    id: 'exp002',
    customerId: 'cust002',
    customerName: 'PRIYA SHARMA',
    planType: 'Fiber Plus',
    expiredDate: '2025-12-08',
    reason: 'payment_failed',
    source: 'BSNL',
    createdAt: '2025-12-08T14:15:00.000Z'
  },
  {
    id: 'exp003',
    customerId: 'cust003',
    customerName: 'ARUN KUMAR',
    planType: 'Broadband Premium',
    expiredDate: '2025-12-05',
    reason: 'customer_request',
    source: 'BSNL',
    createdAt: '2025-12-05T09:45:00.000Z'
  },
  {
    id: 'exp004',
    customerId: 'cust004',
    customerName: 'SNEHA REDDY',
    planType: 'Fiber Basic',
    expiredDate: '2025-12-03',
    reason: 'service_ended',
    source: 'BSNL',
    createdAt: '2025-12-03T16:20:00.000Z'
  },
  {
    id: 'exp005',
    customerId: 'cust005',
    customerName: 'MOHAMMAD ALI',
    planType: 'Broadband Standard',
    expiredDate: '2025-12-01',
    reason: 'payment_failed',
    source: 'BSNL',
    createdAt: '2025-12-01T11:10:00.000Z'
  },

  // Previous month expirations
  {
    id: 'exp006',
    customerId: 'cust006',
    customerName: 'KAVITHA NAIR',
    planType: 'Fiber Plus',
    expiredDate: '2025-11-28',
    reason: 'service_ended',
    source: 'BSNL',
    createdAt: '2025-11-28T13:25:00.000Z'
  },
  {
    id: 'exp007',
    customerId: 'cust007',
    customerName: 'VIKRAM SINGH',
    planType: 'Broadband Premium',
    expiredDate: '2025-11-25',
    reason: 'customer_request',
    source: 'BSNL',
    createdAt: '2025-11-25T08:30:00.000Z'
  },
  {
    id: 'exp008',
    customerId: 'cust008',
    customerName: 'LAKSHMI DEVI',
    planType: 'Broadband Basic',
    expiredDate: '2025-11-20',
    reason: 'payment_failed',
    source: 'BSNL',
    createdAt: '2025-11-20T15:45:00.000Z'
  },
  {
    id: 'exp009',
    customerId: 'cust009',
    customerName: 'SURESHBABU G',
    planType: 'Fiber Standard',
    expiredDate: '2025-11-15',
    reason: 'service_ended',
    source: 'BSNL',
    createdAt: '2025-11-15T12:00:00.000Z'
  },
  {
    id: 'exp010',
    customerId: 'cust010',
    customerName: 'MEENA KUMARI',
    planType: 'Broadband Plus',
    expiredDate: '2025-11-10',
    reason: 'customer_request',
    source: 'BSNL',
    createdAt: '2025-11-10T10:15:00.000Z'
  },

  // Two months ago
  {
    id: 'exp011',
    customerId: 'cust011',
    customerName: 'RAMESH BABU',
    planType: 'Fiber Premium',
    expiredDate: '2025-10-30',
    reason: 'service_ended',
    source: 'BSNL',
    createdAt: '2025-10-30T14:30:00.000Z'
  },
  {
    id: 'exp012',
    customerId: 'cust012',
    customerName: 'SARALA DEVI',
    planType: 'Broadband Standard',
    expiredDate: '2025-10-25',
    reason: 'payment_failed',
    source: 'BSNL',
    createdAt: '2025-10-25T09:20:00.000Z'
  },
  {
    id: 'exp013',
    customerId: 'cust013',
    customerName: 'GOPAL KRISHNA',
    planType: 'Broadband Basic',
    expiredDate: '2025-10-20',
    reason: 'customer_request',
    source: 'BSNL',
    createdAt: '2025-10-20T16:45:00.000Z'
  },
  {
    id: 'exp014',
    customerId: 'cust014',
    customerName: 'VENKATA RAMANA',
    planType: 'Fiber Plus',
    expiredDate: '2025-10-15',
    reason: 'service_ended',
    source: 'BSNL',
    createdAt: '2025-10-15T11:35:00.000Z'
  },
  {
    id: 'exp015',
    customerId: 'cust015',
    customerName: 'ANJALI SHARMA',
    planType: 'Broadband Premium',
    expiredDate: '2025-10-10',
    reason: 'payment_failed',
    source: 'BSNL',
    createdAt: '2025-10-10T13:50:00.000Z'
  },

  // Three months ago (for yearly view)
  {
    id: 'exp016',
    customerId: 'cust016',
    customerName: 'CHANDRASHEKAR',
    planType: 'Fiber Standard',
    expiredDate: '2025-09-28',
    reason: 'service_ended',
    source: 'BSNL',
    createdAt: '2025-09-28T08:15:00.000Z'
  },
  {
    id: 'exp017',
    customerId: 'cust017',
    customerName: 'PADMAVATHI',
    planType: 'Broadband Plus',
    expiredDate: '2025-09-20',
    reason: 'customer_request',
    source: 'BSNL',
    createdAt: '2025-09-20T15:30:00.000Z'
  },
  {
    id: 'exp018',
    customerId: 'cust018',
    customerName: 'BHARATH KUMAR',
    planType: 'Broadband Basic',
    expiredDate: '2025-09-15',
    reason: 'payment_failed',
    source: 'BSNL',
    createdAt: '2025-09-15T12:25:00.000Z'
  },
  {
    id: 'exp019',
    customerId: 'cust019',
    customerName: 'NAGARATHNAMMA',
    planType: 'Fiber Basic',
    expiredDate: '2025-09-10',
    reason: 'service_ended',
    source: 'BSNL',
    createdAt: '2025-09-10T10:40:00.000Z'
  },
  {
    id: 'exp020',
    customerId: 'cust020',
    customerName: 'RAJESHWAR REDDY',
    planType: 'Broadband Premium',
    expiredDate: '2025-09-05',
    reason: 'customer_request',
    source: 'BSNL',
    createdAt: '2025-09-05T14:55:00.000Z'
  },

  // Six months ago (for yearly comparison)
  {
    id: 'exp021',
    customerId: 'cust021',
    customerName: 'SWAPNA DEVI',
    planType: 'Fiber Plus',
    expiredDate: '2025-06-30',
    reason: 'service_ended',
    source: 'BSNL',
    createdAt: '2025-06-30T09:10:00.000Z'
  },
  {
    id: 'exp022',
    customerId: 'cust022',
    customerName: 'ABDUL KHADER',
    planType: 'Broadband Standard',
    expiredDate: '2025-06-25',
    reason: 'payment_failed',
    source: 'BSNL',
    createdAt: '2025-06-25T16:20:00.000Z'
  },
  {
    id: 'exp023',
    customerId: 'cust023',
    customerName: 'VIJAYALAKSHMI',
    planType: 'Broadband Basic',
    expiredDate: '2025-06-20',
    reason: 'customer_request',
    source: 'BSNL',
    createdAt: '2025-06-20T11:45:00.000Z'
  },
  {
    id: 'exp024',
    customerId: 'cust024',
    customerName: 'MURALI KRISHNA',
    planType: 'Fiber Premium',
    expiredDate: '2025-06-15',
    reason: 'service_ended',
    source: 'BSNL',
    createdAt: '2025-06-15T13:35:00.000Z'
  },
  {
    id: 'exp025',
    customerId: 'cust025',
    customerName: 'GEETHA DEVI',
    planType: 'Broadband Plus',
    expiredDate: '2025-06-10',
    reason: 'payment_failed',
    source: 'BSNL',
    createdAt: '2025-06-10T08:25:00.000Z'
  }
];

// Helper function to get sample data with date filtering
export const getFilteredExpiredData = (dateRange: { startDate: Date; endDate: Date }) => {
  return sampleExpiredOverviewData.filter(record => {
    const recordDate = new Date(record.expiredDate);
    return recordDate >= dateRange.startDate && recordDate <= dateRange.endDate;
  });
};

// Helper function to group expired data by time periods
export const groupExpiredDataByPeriod = (data: any[], period: 'day' | 'week' | 'month' | 'year') => {
  const groupedData: { [key: string]: number } = {};
  
  data.forEach(record => {
    const date = new Date(record.expiredDate);
    let key = '';
    
    switch (period) {
      case 'day':
        key = date.getDate().toString();
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = `${weekStart.getDate()}/${weekStart.getMonth() + 1}`;
        break;
      case 'month':
        key = date.toLocaleString('default', { month: 'short' });
        break;
      case 'year':
        key = date.toLocaleString('default', { month: 'short' });
        break;
    }
    
    groupedData[key] = (groupedData[key] || 0) + 1;
  });
  
  return Object.entries(groupedData).map(([name, value]) => ({ name, value }));
};