<template>
    <ClientOnly>
        <div class="map-picker">
            <label class="block text-sm font-medium text-gray-700 mb-2">选择位置</label>

            <div class="space-y-2">
                <input
                    :value="coordinates"
                    type="text"
                    placeholder="纬度,经度（例如：39.9042,116.4074）"
                    readonly
                    class="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button
                    type="button"
                    @click="getCurrentLocation"
                    :disabled="gettingLocation"
                    class="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition">
                    {{ gettingLocation ? '获取中...' : '获取当前位置' }}
                </button>
                <button
                    type="button"
                    @click="openFullscreenMap"
                    class="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
                    地图选点
                </button>
            </div>
            <p class="text-xs text-gray-500 mt-1">
                点击"获取当前位置"按钮自动获取位置，或点击"地图选点"在地图上选择位置
            </p>
        </div>

        <!-- 全屏地图模态框 -->
        <Teleport to="body">
            <div
                v-if="showFullscreenMap"
                class="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center"
                @click.self="closeFullscreenMap">
                <div class="bg-white rounded-lg shadow-xl w-full h-full flex flex-col">
                    <!-- 头部工具栏 -->
                    <div class="flex justify-between items-center p-4 border-b">
                        <h3 class="text-lg font-semibold text-gray-800">选择位置</h3>
                        <div class="flex gap-2">
                            <button
                                type="button"
                                @click="confirmLocation"
                                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
                                确定
                            </button>
                            <button
                                type="button"
                                @click="closeFullscreenMap"
                                class="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition">
                                取消
                            </button>
                        </div>
                    </div>

                    <!-- 地图容器 -->
                    <div class="flex-1 relative">
                        <div ref="fullscreenMapContainer" class="w-full h-full"></div>
                    </div>

                    <!-- 底部提示 -->
                    <div class="p-4 border-t bg-gray-50">
                        <p class="text-sm text-gray-600 text-center">
                            在地图上点击选择位置，然后点击"确定"按钮确认
                        </p>
                    </div>
                </div>
            </div>
        </Teleport>
        <template #fallback>
            <div class="map-picker">
                <div class="flex justify-between items-center mb-2">
                    <label class="block text-sm font-medium text-gray-700">选择位置</label>
                </div>
                <div class="flex gap-2">
                    <input
                        :value="coordinates"
                        type="text"
                        placeholder="纬度,经度（例如：39.9042,116.4074）"
                        readonly
                        class="flex-1 border border-gray-300 rounded-lg px-4 py-2 bg-gray-50" />
                </div>
                <p class="text-xs text-gray-500 mt-1">加载中...</p>
            </div>
        </template>
    </ClientOnly>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import XYZ from 'ol/source/XYZ'
import { fromLonLat, toLonLat } from 'ol/proj'
import { defaults as defaultControls } from 'ol/control'
import { defaults as defaultInteractions } from 'ol/interaction'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import { Style, Icon } from 'ol/style'

const props = defineProps<{
    modelValue?: string
}>()

const emit = defineEmits<{
    'update:modelValue': [value: string]
}>()

const fullscreenMapContainer = ref<HTMLDivElement | null>(null)
const showFullscreenMap = ref(false)
const gettingLocation = ref(false)
const coordinates = ref(props.modelValue || '')
const selectedCoordinate = ref<number[] | null>(null)

let fullscreenMap: Map | null = null
let fullscreenMarkerLayer: VectorLayer<VectorSource> | null = null
let fullscreenMarkerSource: VectorSource | null = null

// 高德地图瓦片源
const createGaodeLayer = () => {
    return new TileLayer({
        source: new XYZ({
            url: 'http://wprd0{1-4}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scl=1&style=7',
            crossOrigin: 'anonymous',
            tileSize: 256,
        }),
    })
}

// 初始化全屏地图
const initFullscreenMap = async () => {
    if (!fullscreenMapContainer.value) return

    // 创建标记图层
    fullscreenMarkerSource = new VectorSource()
    fullscreenMarkerLayer = new VectorLayer({
        source: fullscreenMarkerSource,
        style: new Style({
            image: new Icon({
                anchor: [0.5, 1],
                src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDNy41ODYgMiA0IDUuNTg2IDQgMTBDNCAxNS41NTUgOS4zNzMgMjEuODk3IDEyIDIzQzE0LjYyNyAyMS44OTcgMjAgMTUuNTU1IDIwIDEwQzIwIDUuNTg2IDE2LjQxNCAyIDEyIDJaIiBmaWxsPSIjRkYwMDAwIi8+CjxjaXJjbGUgY3g9IjEyIiBjeT0iMTAiIHI9IjMiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo=',
                scale: 2,
            }),
        }),
    })

    // 如果有初始坐标，设置地图中心和标记
    let center = [108.947587, 34.269439] // 默认西安
    let zoom = 10

    if (coordinates.value) {
        const [lat, lon] = coordinates.value.split(',').map(Number)
        if (!isNaN(lat) && !isNaN(lon)) {
            center = [lon, lat]
            zoom = 15
            // 如果有坐标，显示标记点
            addMarker(fromLonLat(center, 'EPSG:3857'), fullscreenMarkerSource)
        }
    }
    // 如果没有坐标，不显示标记点（markerSource 保持为空）

    fullscreenMap = new Map({
        target: fullscreenMapContainer.value,
        layers: [createGaodeLayer(), fullscreenMarkerLayer],
        view: new View({
            center: fromLonLat(center),
            zoom: zoom,
            projection: 'EPSG:3857',
        }),
        controls: defaultControls({
            zoom: true,
            attribution: false,
        }),
        interactions: defaultInteractions(),
    })

    // 使用 singleclick 事件，不会干扰拖拽
    // singleclick 只在点击（没有拖拽）时触发
    fullscreenMap.on('singleclick', evt => {
        const coordinate = evt.coordinate
        selectedCoordinate.value = coordinate
        addMarker(coordinate, fullscreenMarkerSource)
    })
}

// 添加标记
const addMarker = (coordinate: number[], source: VectorSource) => {
    if (!source) return

    source.clear()
    const feature = new Feature({
        geometry: new Point(coordinate),
    })
    source.addFeature(feature)
}

// 获取当前位置
const getCurrentLocation = () => {
    if (!navigator.geolocation) {
        alert('您的浏览器不支持地理位置功能')
        return
    }

    gettingLocation.value = true
    navigator.geolocation.getCurrentPosition(
        position => {
            const latitude = position.coords.latitude
            const longitude = position.coords.longitude
            coordinates.value = `${latitude},${longitude}`
            emit('update:modelValue', coordinates.value)

            // 如果全屏地图已初始化，更新地图中心和标记
            if (fullscreenMap && fullscreenMarkerSource) {
                const center = fromLonLat([longitude, latitude], 'EPSG:3857')
                fullscreenMap.getView().setCenter(center)
                fullscreenMap.getView().setZoom(15)
                addMarker(center, fullscreenMarkerSource)
            }

            gettingLocation.value = false
        },
        error => {
            gettingLocation.value = false
            let errorMsg = '获取位置失败：'
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    errorMsg += '用户拒绝了位置请求'
                    break
                case error.POSITION_UNAVAILABLE:
                    errorMsg += '位置信息不可用'
                    break
                case error.TIMEOUT:
                    errorMsg += '获取位置超时'
                    break
                default:
                    errorMsg += '未知错误'
                    break
            }
            alert(errorMsg)
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
        },
    )
}

// 打开全屏地图
const openFullscreenMap = async () => {
    showFullscreenMap.value = true
    await nextTick()
    if (!fullscreenMapContainer.value) return

    if (!fullscreenMap) {
        // 地图不存在，初始化
        initFullscreenMap()
    } else {
        // 地图已存在，重新设置 target 并更新大小
        fullscreenMap.setTarget(fullscreenMapContainer.value)
        await nextTick()
        fullscreenMap.updateSize()
    }
}

// 关闭全屏地图
const closeFullscreenMap = () => {
    showFullscreenMap.value = false
    selectedCoordinate.value = null
    // 不清理地图实例，保留以便下次快速打开
}

// 确认选择位置
const confirmLocation = () => {
    // 如果用户点击了新位置，使用新位置
    // 如果没有点击新位置但地图上有标记点（初始坐标），使用标记点的坐标
    let coordinateToUse: number[] | null = null

    if (selectedCoordinate.value) {
        // 用户点击了新位置
        coordinateToUse = selectedCoordinate.value
    } else if (fullscreenMarkerSource && fullscreenMarkerSource.getFeatures().length > 0) {
        // 地图上有标记点（可能是初始坐标），使用标记点的坐标
        const feature = fullscreenMarkerSource.getFeatures()[0]
        const geometry = feature.getGeometry()
        if (geometry instanceof Point) {
            coordinateToUse = geometry.getCoordinates()
        }
    }

    if (coordinateToUse && fullscreenMarkerSource) {
        const lonlat = toLonLat(coordinateToUse, 'EPSG:3857')
        const [lon, lat] = lonlat
        coordinates.value = `${lat.toFixed(6)},${lon.toFixed(6)}`
        emit('update:modelValue', coordinates.value)

        showFullscreenMap.value = false
        selectedCoordinate.value = null
    } else {
        alert('请先在地图上点击选择位置')
    }
}

// 监听全屏地图显示状态
watch(showFullscreenMap, async newVal => {
    if (newVal) {
        await nextTick()
        if (!fullscreenMapContainer.value) return

        if (!fullscreenMap) {
            // 地图不存在，初始化
            initFullscreenMap()
        } else {
            // 地图已存在，重新设置 target 并更新大小
            fullscreenMap.setTarget(fullscreenMapContainer.value)
            await nextTick()
            fullscreenMap.updateSize()
        }
    } else {
        // 关闭时，移除地图 target 但保留实例
        if (fullscreenMap) {
            fullscreenMap.setTarget(undefined)
        }
    }
})

// 监听外部值变化
watch(
    () => props.modelValue,
    newVal => {
        if (newVal !== coordinates.value) {
            coordinates.value = newVal || ''
            if (fullscreenMap && fullscreenMarkerSource) {
                if (coordinates.value) {
                    // 如果有坐标，更新地图中心并显示标记
                    const [lat, lon] = coordinates.value.split(',').map(Number)
                    if (!isNaN(lat) && !isNaN(lon)) {
                        const center = fromLonLat([lon, lat], 'EPSG:3857')
                        fullscreenMap.getView().setCenter(center)
                        addMarker(center, fullscreenMarkerSource)
                    }
                } else {
                    // 如果没有坐标，清除标记
                    fullscreenMarkerSource.clear()
                }
            }
        }
    },
)

onUnmounted(() => {
    if (fullscreenMap) {
        fullscreenMap.setTarget(undefined)
        fullscreenMap = null
    }
})
</script>

<style scoped>
.map-picker {
    width: 100%;
}

:deep(.ol-viewport) {
    border-radius: 0.5rem;
}

/* 全屏地图样式 */
.fixed {
    position: fixed;
}

.inset-0 {
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
}

.z-50 {
    z-index: 50;
}

.bg-opacity-50 {
    background-color: rgba(0, 0, 0, 0.5);
}

:deep(.ol-viewport) {
    border-radius: 0;
}
</style>
