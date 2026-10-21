<template>
  <div class="dashboard">
    <!-- 顶部标题 -->
    <div class="header">
      <div class="header-left">
        <h1 class="title">智慧机场三维可视化</h1>
        <span class="subtitle">Vue3 · Pinia · Cesium · Ant Design Vue · ECharts · Vite</span>
      </div>
      <a-button type="primary" size="large" shape="round" @click="router.push('/scene')">
        进入三维场景 →
      </a-button>
    </div>

    <!-- 统计卡片（mock 数据） -->
    <div class="cards">
      <a-card class="stat-card" :bordered="true">
        <a-statistic title="今日航班量（架）" :value="stats.flightCount" suffix="架" />
      </a-card>
      <a-card class="stat-card" :bordered="true">
        <a-statistic title="机位占用率（%）" :value="stats.parkingRate" suffix="%" />
      </a-card>
      <a-card class="stat-card" :bordered="true">
        <a-statistic title="设备在线率（%）" :value="stats.deviceOnlineRate" :precision="1" suffix="%" />
      </a-card>
      <a-card class="stat-card" :bordered="true">
        <a-statistic title="当前告警（条）" :value="stats.alarmCount" />
      </a-card>
    </div>

    <!-- 图表区（mock 数据） -->
    <div class="charts">
      <a-card title="旅客吞吐量（万人次/周）" size="small" :bordered="true">
        <div class="chart"><ChartPanel :option="passengerOption" /></div>
      </a-card>
      <a-card title="机位占用分布" size="small" :bordered="true">
        <div class="chart"><ChartPanel :option="parkingOption" /></div>
      </a-card>
      <a-card title="告警类型分布" size="small" :bordered="true">
        <div class="chart"><ChartPanel :option="alarmOption" /></div>
      </a-card>
    </div>

    <!-- 配置提示 -->
    <a-alert
      class="tip"
      type="info"
      show-icon
      message="使用前请配置 Key（免费申请）"
      description="天地图 key（console.tianditu.gov.cn 申请）与 Cesium ion token（ion.cesium.com 注册）填入项目根目录 .env，或在 src/config/index.js 中填写。未配置时底图自动兜底为 OpenStreetMap。"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import ChartPanel from '@/components/ChartPanel.vue'
import {
  getOverviewStats,
  getPassengerTrend,
  getParkingDistribution,
  getAlarmDistribution
} from '@/api/mock'

const router = useRouter()

const stats = getOverviewStats()

const passengerOption = computed(() => {
  const d = getPassengerTrend()
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 36, right: 12, top: 24, bottom: 24 },
    xAxis: { type: 'category', data: d.week },
    yAxis: { type: 'value' },
    series: [
      {
        name: '旅客吞吐',
        type: 'bar',
        data: d.data,
        itemStyle: { color: '#1677ff' }
      }
    ]
  }
})

const parkingOption = computed(() => {
  return {
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, textStyle: { fontSize: 10 } },
    series: [
      {
        name: '机位占用',
        type: 'pie',
        radius: ['45%', '68%'],
        data: getParkingDistribution()
      }
    ]
  }
})

const alarmOption = computed(() => {
  const d = getAlarmDistribution()
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 36, right: 12, top: 24, bottom: 24 },
    xAxis: { type: 'category', data: d.types },
    yAxis: { type: 'value' },
    series: [
      {
        name: '告警数',
        type: 'bar',
        data: d.data,
        itemStyle: { color: '#ff4d4f' }
      }
    ]
  }
})
</script>

<style scoped>
.dashboard {
  padding: 28px 32px;
  min-height: 100%;
  background: #f0f2f5;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.title {
  margin: 0;
  font-size: 24px;
  color: #0a4a8a;
}

.subtitle {
  color: #888;
  font-size: 13px;
}

.cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.stat-card {
  text-align: center;
}

.charts {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.chart {
  height: 220px;
}

.tip {
  max-width: 860px;
}
</style>
