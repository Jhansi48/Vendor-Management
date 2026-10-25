import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { Chart } from 'chart.js/auto';
import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  kpis: any = {
    total_vendors: 0,
    active_vendors: 0,
    pending_approvals: 0,
    active_pos: 0,
    procurement_value: 0.0,
    average_reliability: 100.0,
    high_risk_vendors: 0,
    expiring_contracts: 0
  };

  chartsData: any = null;
  loadingKPIs = true;
  loadingCharts = true;
  recentActivities: any[] = [];
  riskActions: any[] = [];

  // Chart references for destruction
  private spendingChart: Chart | null = null;
  private reliabilityChart: Chart | null = null;

  @ViewChild('spendingCanvas') spendingCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('reliabilityCanvas') reliabilityCanvas!: ElementRef<HTMLCanvasElement>;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadKPIs();
    this.loadCharts();
  }

  ngOnDestroy(): void {
    // Clean up charts to avoid canvas recycling errors
    if (this.spendingChart) this.spendingChart.destroy();
    if (this.reliabilityChart) this.reliabilityChart.destroy();
  }

  loadKPIs(): void {
    this.dashboardService.getKPIs().subscribe({
      next: (data) => {
        this.kpis = data;
        this.loadingKPIs = false;
      },
      error: (err) => {
        console.error('Error fetching KPIs', err);
        this.loadingKPIs = false;
      }
    });
  }

  loadCharts(): void {
    this.dashboardService.getCharts().subscribe({
      next: (data) => {
        this.chartsData = data;
        this.recentActivities = data.recent_activities || [];
        this.riskActions = data.risk_actions || [];
        this.loadingCharts = false;
        // Schedule chart rendering in macro-task queue to ensure canvas elements exist in view
        setTimeout(() => this.renderCharts(), 0);
      },
      error: (err) => {
        console.error('Error fetching charts', err);
        this.loadingCharts = false;
      }
    });
  }

  renderCharts(): void {
    if (!this.chartsData) return;

    // 1. Procurement Spend Trend (Line Chart with Editorial Shading)
    const months = this.chartsData.spending_by_month.map((x: any) => x.month);
    const spending = this.chartsData.spending_by_month.map((x: any) => x.amount);
    
    this.spendingChart = new Chart(this.spendingCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: months,
        datasets: [{
          label: 'Spend ($)',
          data: spending,
          borderColor: '#234B3B',
          backgroundColor: 'rgba(35, 75, 59, 0.08)',
          fill: true,
          tension: 0.25,
          borderWidth: 2.2,
          pointBackgroundColor: '#B85C38',
          pointBorderColor: '#FFFFFF',
          pointBorderWidth: 2,
          pointRadius: 4.5,
          pointHoverRadius: 6.5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { 
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1C3D30',
            titleFont: { family: 'Plus Jakarta Sans', size: 12 },
            bodyFont: { family: 'JetBrains Mono', size: 13 },
            padding: 10,
            cornerRadius: 4,
            callbacks: {
              label: (context) => ' Spend: $' + Number(context.raw).toLocaleString()
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#77776F', font: { family: 'Plus Jakarta Sans', size: 11 } }
          },
          y: {
            grid: { color: '#E8E1D7' },
            ticks: { 
              color: '#77776F', 
              font: { family: 'JetBrains Mono', size: 11 },
              callback: (value) => '$' + Number(value).toLocaleString()
            }
          }
        }
      }
    });

    // 2. Vendor Reliability & Risk Overview (Doughnut Chart)
    const riskLabels = this.chartsData.risk_distribution.map((x: any) => x.risk_level);
    const riskCounts = this.chartsData.risk_distribution.map((x: any) => x.count);

    // Map risk levels to bespoke brand palette
    const colorMap: { [key: string]: string } = {
      'LOW': '#234B3B',        // Deep Forest Green
      'MEDIUM': '#7A997D',     // Deepened Sage for accessibility
      'HIGH': '#C27803',       // Muted Amber
      'CRITICAL': '#9B2C2C'    // Muted Red
    };
    const colors = riskLabels.map((label: string) => colorMap[label] || '#77776F');
    
    this.reliabilityChart = new Chart(this.reliabilityCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: riskLabels,
        datasets: [{
          data: riskCounts,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#FFFFFF',
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 10,
              boxHeight: 10,
              padding: 14,
              font: { size: 11, family: 'Plus Jakarta Sans', weight: 500 },
              color: '#292B28'
            }
          },
          tooltip: {
            backgroundColor: '#1C3D30',
            bodyFont: { family: 'JetBrains Mono', size: 12 },
            padding: 8,
            cornerRadius: 4
          }
        },
        cutout: '68%'
      }
    });
  }

  getRiskRoute(item: any): any[] {
    if (item.type === 'high_risk_vendor') {
      return ['/vendors', item.id];
    } else if (item.type === 'pending_approval') {
      return ['/procurement'];
    } else if (item.type === 'expiring_contract') {
      return ['/contracts'];
    }
    return ['/dashboard'];
  }
}
