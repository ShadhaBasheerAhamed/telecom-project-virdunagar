# Dashboard Charts Implementation Plan
## Fixing Expired Overview and Complaints Charts

### Current Issues Identified

#### 1. Expired Overview Chart
- **Location**: EnhancedDashboard.tsx lines 260-270
- **Data Source**: `expiredChartData` from `data.expiredData`
- **Current Problem**: Dashboard service returns all zeros (`expiredData: chartData.map(d => ({ ...d, value: 0 }))`)
- **Missing**: No `expired_overview` collection exists

#### 2. Complaints Chart  
- **Location**: EnhancedDashboard.tsx lines 210-226
- **Data Source**: `pieData` from `data.complaintsData`
- **Current Problem**: Dashboard service returns hardcoded zeros (`complaintsData: [{ name: 'Open', value: 0 }, ...]`)
- **Existing Data**: `complaints` collection exists with proper structure but not used by dashboard service

### Solution Design

#### For Complaints Chart
1. **Use Existing Data**: Leverage existing `complaints` collection
2. **Real-time Data**: Fetch actual complaint statuses from Firebase
3. **Chart Data**: Transform complaint status counts into pie chart format
4. **Time Range Support**: Filter complaints by date range

#### For Expired Overview Chart
1. **New Collection**: Create `expired_overview` collection
2. **Data Structure**: Track expired customer records with dates and reasons
3. **Time-based Analysis**: Support monthly/yearly expiration trends
4. **Chart Visualization**: Show expiration counts over time periods

### Implementation Steps

#### Step 1: Create Expired Overview Collection Schema
```typescript
// Collection: expired_overview
interface ExpiredRecord {
  id: string;
  customerId: string;
  customerName: string;
  planType: string;
  expiredDate: string; // ISO date string
  reason: string; // 'service_ended', 'payment_failed', 'customer_request', etc.
  source: string; // Data source (BSNL, etc.)
  createdAt: string; // ISO timestamp
}
```

#### Step 2: Update Dashboard Service Methods

**New Method: getExpiredOverviewData**
```typescript
static async getExpiredOverviewData(dateRange: DateFilter): Promise<any[]> {
  // Fetch expired records from expired_overview collection
  // Group by time periods (daily/weekly/monthly)
  // Return chart-formatted data
}
```

**Update Method: generateChartData**
```typescript
// Add real data fetching for complaintsData and expiredData
complaintsData: await this.getComplaintsStatusData(selectedDate, range),
expiredData: await this.getExpiredOverviewData(dateRange),
```

#### Step 3: Add Support Methods

**Complaints Status Method:**
```typescript
static async getComplaintsStatusData(selectedDate: Date, range: string): Promise<any[]> {
  // Fetch from existing complaints collection
  // Group by status: Open, Resolved, Pending
  // Apply time range filtering
  // Return pie chart format
}
```

#### Step 4: Sample Data Creation
1. **Expired Records**: Create sample expired overview records
2. **Complaints**: Ensure complaints collection has varied status data
3. **Test Data**: Add records across different time periods

#### Step 5: Integration Testing
1. **Time Range Filters**: Test with week/month/year filters
2. **Data Source Filtering**: Test with different data sources
3. **Real-time Updates**: Verify charts update when data changes
4. **Error Handling**: Test fallback behavior when collections are empty

### Expected Outcomes

#### Complaints Chart
- Shows real distribution of complaint statuses
- Updates based on actual complaint data
- Supports time range filtering
- Displays meaningful pie chart segments

#### Expired Overview Chart
- Shows trends of customer expirations over time
- Displays meaningful bar chart data
- Supports time range analysis
- Provides insights into expiration patterns

### Technical Considerations

1. **Performance**: Optimize queries with proper indexing
2. **Real-time Updates**: Consider Firestore listeners for live updates
3. **Error Handling**: Graceful fallbacks when collections are empty
4. **Data Consistency**: Ensure proper date handling and filtering
5. **Scalability**: Design for growing data volumes

### Success Criteria

- [ ] Expired Overview chart displays non-zero data
- [ ] Complaints chart shows real status distribution
- [ ] Both charts respond to time range changes
- [ ] Charts work with different data source filters
- [ ] Implementation handles empty states gracefully
- [ ] Performance is acceptable with reasonable data volumes