// 在 OverviewTab.js 或其他地方添加测试按钮
// 仅用于开发测试，生产环境需要删除

import { useGamification } from '../context/GamificationContext';

// 在组件中
const { syncTotalDistanceFromBackend, metersPerBlindBox, totalRunDistance } = useGamification();

// 添加测试按钮
<TouchableOpacity 
  style={styles.testButton}
  onPress={() => {
    console.log('=== 盲盒系统状态 ===');
    console.log('总跑步距离:', totalRunDistance, 'm');
    console.log('盲盒目标:', metersPerBlindBox, 'm');
    console.log('应获得盲盒:', Math.floor(totalRunDistance / metersPerBlindBox));
    console.log('进度条显示:', totalRunDistance % metersPerBlindBox, 'm');
    console.log('进度百分比:', Math.round((totalRunDistance % metersPerBlindBox) / metersPerBlindBox * 100), '%');
    
    // 触发重新同步
    syncTotalDistanceFromBackend();
  }}
>
  <Text>🧪 测试盲盒系统</Text>
</TouchableOpacity>

// 样式
testButton: {
  padding: 16,
  backgroundColor: '#ff6b6b',
  borderRadius: 8,
  margin: 16,
  alignItems: 'center',
}

