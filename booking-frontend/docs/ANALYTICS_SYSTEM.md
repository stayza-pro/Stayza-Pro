# Advanced Property Analytics System

A comprehensive analytics dashboard for property management with real-time insights, performance tracking, and intelligent alerts.

## 🚀 Features

### 📊 Analytics Overview
- **Key Performance Metrics**: Occupancy rate, total revenue, guest count, and average ratings
- **Revenue Analytics**: ADR (Average Daily Rate), RevPAR (Revenue per Available Room), and trends
- **Booking Metrics**: Total bookings, cancellation rates, and lead times
- **Guest Analytics**: Satisfaction scores, returning guest rates, and stay durations
- **Interactive Charts**: Occupancy and revenue trend visualizations

### 📈 Performance Metrics
- **Goal Tracking**: Set and monitor performance targets
- **Progress Indicators**: Visual progress bars for each metric
- **Category Filtering**: Filter by occupancy, revenue, guest, or review metrics
- **Success Rates**: Calculate achievement percentages
- **Trend Analysis**: Track performance improvements over time

### 🚨 Intelligent Alerts
- **Real-time Monitoring**: Automatic detection of performance issues
- **Severity Levels**: Critical, warning, and informational alerts
- **Category-based Alerts**: Separate alerts for different business areas
- **Action Items**: Clear indicators for alerts requiring immediate attention
- **Historical Tracking**: View past alerts and resolution status

### 📅 Time Range Analysis
- **Flexible Periods**: 7 days, 30 days, 90 days, or custom ranges
- **Comparative Analysis**: Compare performance across different time periods
- **Seasonal Insights**: Identify seasonal patterns and trends
- **Year-over-year Comparison**: Track annual performance improvements

## 🏗️ Architecture

### Components Structure
```
src/components/analytics/
├── PropertyAnalyticsDashboard.tsx    # Main dashboard component
├── AnalyticsOverview.tsx             # Overview metrics and charts
├── PerformanceMetrics.tsx            # Goal tracking and performance
├── AlertsPanel.tsx                   # Intelligent alerts system
├── MetricCard.tsx                    # Reusable metric display card
├── charts/
│   └── TrendChart.tsx               # Interactive trend visualization
└── index.ts                         # Component exports
```

### Types System
```typescript
// Core Analytics Types
PropertyAnalytics {
  occupancy: OccupancyMetrics
  revenue: RevenueMetrics
  guests: GuestAnalytics
  reviews: ReviewMetrics
  bookings: BookingMetrics
  market: MarketAnalysis
}

// Time Range Configuration
AnalyticsTimeRange {
  start: Date
  end: Date
  preset: string
}

// Performance Tracking
AnalyticsMetric {
  value: number
  change: number
  trend: 'up' | 'down' | 'stable'
}
```

### Hooks System
```typescript
// Data Management Hooks
usePropertyAnalytics()     // Fetch analytics data with caching
useAnalyticsTimeRange()    // Time range selection and presets
useAnalyticsExport()       // Export functionality
```

## 🎯 Key Metrics Tracked

### Occupancy Analytics
- **Current Occupancy**: Real-time occupancy percentage
- **Average Occupancy**: Historical average across time range
- **Peak Occupancy**: Highest occupancy achieved
- **Low Occupancy Periods**: Identification of underperforming periods
- **Occupancy Trends**: Daily/weekly occupancy patterns

### Revenue Analytics
- **Total Revenue**: Aggregate revenue for the period
- **Average Daily Rate (ADR)**: Average revenue per occupied room
- **Revenue per Available Room (RevPAR)**: Combined occupancy and rate metric
- **Revenue Trends**: Daily revenue patterns and forecasting
- **Revenue Growth**: Period-over-period revenue comparison

### Guest Analytics
- **Total Guests**: Unique guests served
- **Returning Guest Rate**: Percentage of repeat customers
- **Average Stay Duration**: Average nights per booking
- **Guest Satisfaction Score**: Overall satisfaction rating
- **Guest Demographics**: Age, location, and booking patterns

### Review Analytics
- **Average Rating**: Overall property rating
- **Total Reviews**: Number of reviews received
- **Response Rate**: Percentage of reviews responded to
- **Sentiment Analysis**: Positive, neutral, and negative sentiment breakdown
- **Rating Distribution**: Distribution across 1-5 star ratings

## 🚨 Alert System

### Alert Categories
1. **Critical Alerts** 🔴
   - Occupancy below 50%
   - Guest satisfaction below 4.0
   - Revenue significantly below target
   - High cancellation rates (>15%)

2. **Warning Alerts** 🟡
   - Occupancy below 65%
   - Guest satisfaction below 4.3
   - Declining revenue trends
   - Moderate cancellation rates (>10%)

3. **Informational Alerts** 🔵
   - Excellent occupancy (>85%)
   - Outstanding reviews (4.7+)
   - Revenue targets achieved
   - High guest satisfaction

### Alert Features
- **Real-time Detection**: Automatic monitoring and alert generation
- **Contextual Information**: Detailed descriptions and current vs target values
- **Action Required Flags**: Clear indicators for urgent issues
- **Historical Tracking**: View alert history and resolution patterns
- **Category Filtering**: Filter alerts by type and severity

## 📊 Performance Goals

### Default Targets
- **Occupancy Rate**: 75% minimum target
- **Average Daily Rate**: $150 target
- **RevPAR**: $112.50 target (75% × $150)
- **Guest Satisfaction**: 4.5/5.0 minimum
- **Returning Guests**: 25% target
- **Review Rating**: 4.7/5.0 excellence target
- **Response Rate**: 90% target
- **Cancellation Rate**: <5% target

### Progress Tracking
- **Visual Progress Bars**: Clear progress indicators for each goal
- **Achievement Status**: Color-coded status (achieved/at-risk/needs attention)
- **Trend Indicators**: Up/down/stable trend arrows
- **Success Rate Calculation**: Overall performance percentage

## 🔧 Technical Implementation

### State Management
- **React Query**: Data fetching with automatic caching and background updates
- **Local State**: Component-level state for UI interactions
- **Time Range State**: Centralized time range management

### Performance Optimization
- **Data Caching**: 5-minute cache for analytics data
- **Background Refresh**: Automatic data updates without user interaction
- **Lazy Loading**: Components loaded on demand
- **Optimistic Updates**: Immediate UI updates for better UX

### Animations & UX
- **Framer Motion**: Smooth animations and transitions
- **Loading States**: Skeleton screens during data fetching
- **Error Handling**: Graceful error states with retry options
- **Responsive Design**: Mobile-first responsive layout

## 🎨 Design System

### Color Coding
- **Blue**: Primary actions and occupancy metrics
- **Green**: Revenue and positive trends
- **Purple**: Guest and satisfaction metrics
- **Yellow**: Reviews and ratings
- **Red**: Critical alerts and issues
- **Gray**: Neutral states and inactive elements

### Typography Hierarchy
- **Headings**: 2xl, xl, lg for different section levels
- **Metrics**: 2xl bold for key numbers
- **Labels**: sm for metric descriptions
- **Body**: Base size for general content

## 🚀 Usage

### Basic Implementation
```typescript
import { PropertyAnalyticsDashboard } from '@/components/analytics';

function AnalyticsPage() {
  return (
    <PropertyAnalyticsDashboard 
      propertyId="property-123"
      propertyName="Luxury Downtown Apartment"
    />
  );
}
```

### Custom Time Ranges
```typescript
const { timeRange, updateTimeRange } = useAnalyticsTimeRange();

// Set custom range
updateTimeRange({
  start: new Date('2024-01-01'),
  end: new Date('2024-01-31')
});
```

### Export Analytics
```typescript
const { exportAnalytics, isExporting } = useAnalyticsExport();

// Export to PDF
await exportAnalytics(
  propertyId, 
  timeRange, 
  'pdf', 
  ['overview', 'occupancy', 'revenue']
);
```

## 🔮 Future Enhancements

### Planned Features
- **Predictive Analytics**: ML-powered occupancy and revenue forecasting
- **Benchmark Comparisons**: Compare against market averages
- **Custom Goals**: User-defined performance targets
- **Advanced Charts**: Interactive charts with drill-down capabilities
- **Automated Reports**: Scheduled email reports
- **Multi-property Analytics**: Aggregate analytics across multiple properties

### Integration Opportunities
- **PMS Integration**: Connect with property management systems
- **Channel Manager**: Pull data from booking platforms
- **Revenue Management**: Dynamic pricing recommendations
- **Guest Communication**: Automated guest satisfaction surveys

## 📱 Responsive Design

The analytics dashboard is fully responsive and optimized for:
- **Desktop**: Full feature set with side-by-side layouts
- **Tablet**: Stacked layouts with touch-friendly interfaces
- **Mobile**: Single-column layouts with swipeable cards

## 🔐 Security & Privacy

- **Data Encryption**: All analytics data encrypted in transit and at rest
- **Access Control**: Role-based access to sensitive metrics
- **Audit Logging**: Track all analytics access and exports
- **GDPR Compliance**: Guest data handling complies with privacy regulations

---

Built with ❤️ using Next.js, TypeScript, Tailwind CSS, and Framer Motion.