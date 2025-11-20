import { useEffect } from 'react';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { useToast } from '../../contexts/ToastContext';

/**
 * 会员过期WebSocket监听器
 * 全局监听会员过期消息并显示提示
 */
export const MembershipExpiryListener = () => {
  const { on } = useWebSocket();
  const { warning, info } = useToast();

  useEffect(() => {
    // 监听会员过期消息
    const unsubscribeExpired = on('membership:expired', (data) => {
      console.log('📢 会员已过期:', data);
      
      // 显示过期提示
      warning(
        '会员已过期',
        data.message || '您的会员已过期，部分功能可能受限。点击续费'
      );
    });

    // 监听会员即将过期消息
    const unsubscribeExpiringSoon = on('membership:expiring_soon', (data) => {
      console.log('⏰ 会员即将过期:', data);
      
      info(
        '会员即将过期',
        data.message || `您的会员还有${data.daysLeft || '几'}天过期，请及时续费`
      );
    });

    // 清理订阅
    return () => {
      unsubscribeExpired();
      unsubscribeExpiringSoon();
    };
  }, [on, warning, info]);

  return null; // 该组件不渲染任何内容
};

export default MembershipExpiryListener;
