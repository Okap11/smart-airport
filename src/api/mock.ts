/**
 * 数据层（无后端，模拟接口）。
 * 真实项目中把这些函数的返回值替换为 axios/fetch 请求后端接口即可，
 * 前端（视图层）无需改动。
 */

/** 航班 24h 架次趋势 */
export interface FlightTrend {
  hours: string[]
  depart: number[]
  arrive: number[]
}

/** 旅客吞吐量（周） */
export interface PassengerTrend {
  week: string[]
  data: number[]
}

/** 机位占用分布项 */
export interface ParkingItem {
  value: number
  name: string
}

/** 告警类型分布 */
export interface AlarmDistribution {
  types: string[]
  data: number[]
}

/** 业务统计 */
export interface OverviewStats {
  flightCount: number
  parkingRate: number
  deviceOnlineRate: number
  alarmCount: number
}

/** 航班 24h 架次趋势 */
export function getFlightTrend(): FlightTrend {
  const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`)
  return {
    hours,
    depart: [8, 12, 18, 22, 19, 14, 10, 6, 9, 15, 21, 24, 26, 22, 16, 11, 7, 5, 8, 13, 18, 20, 15, 9],
    arrive: [6, 9, 13, 17, 21, 24, 22, 16, 10, 7, 12, 18, 23, 25, 20, 14, 8, 6, 11, 17, 22, 19, 12, 7]
  }
}

/** 旅客吞吐量（周） */
export function getPassengerTrend(): PassengerTrend {
  return {
    week: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    data: [68, 72, 75, 71, 82, 96, 88]
  }
}

/** 机位占用分布 */
export function getParkingDistribution(): ParkingItem[] {
  return [
    { value: 62, name: '占用' },
    { value: 30, name: '空闲' },
    { value: 8, name: '维修' }
  ]
}

/** 告警类型分布 */
export function getAlarmDistribution(): AlarmDistribution {
  return {
    types: ['入侵', '越界', '设备故障', '消防', '其他'],
    data: [12, 8, 5, 3, 2]
  }
}

/** 业务统计 */
export function getOverviewStats(): OverviewStats {
  return {
    flightCount: 186,
    parkingRate: 62,
    deviceOnlineRate: 97.4,
    alarmCount: 3
  }
}
