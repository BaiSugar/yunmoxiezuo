import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import {
  User,
  Mail,
  Lock,
  Save,
  Loader2,
  X,
  History,
  Gift,
  Copy,
  Check,
  Crown,
  Send,
} from "lucide-react";
import TokenHistoryTab from "./TokenHistoryTab";
import MembershipTab from "./MembershipTab";
import { usersApi } from "../../services/users.api";
import { sendVerificationCode } from "../../services/email.api";

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Tab 类型
type SettingsTab = "profile" | "password" | "membership" | "token-history";

/**
 * 个人设置模态框
 * 支持修改个人信息、密码和查看字数消耗历史
 */
const UserSettingsModal: React.FC<UserSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const auth = useAuth();
  const { user } = auth;
  const { success: showSuccess, error: showError } = useToast();

  // Tab 切换
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  // 基本信息
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [emailVerificationCode, setEmailVerificationCode] = useState("");
  const username = user?.username || "";

  // 修改密码
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // 加载状态
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [isSendingEmailCode, setIsSendingEmailCode] = useState(false);
  const [emailCountdown, setEmailCountdown] = useState(0);

  // 邀请码复制状态
  const [copiedInviteCode, setCopiedInviteCode] = useState(false);

  // 邮箱验证码倒计时
  useEffect(() => {
    if (emailCountdown > 0) {
      const timer = setTimeout(
        () => setEmailCountdown(emailCountdown - 1),
        1000
      );
      return () => clearTimeout(timer);
    }
  }, [emailCountdown]);

  // 当模态框打开时，重置表单数据
  useEffect(() => {
    if (isOpen && user) {
      setNickname(user.nickname || "");
      setEmail(user.email || "");
      setEmailVerificationCode("");
      // 重置密码表单
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      // 重置到第一个 tab
      setActiveTab("profile");
    }
  }, [isOpen, user]);

  // 处理 ESC 键关闭
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // 防止背景滚动
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // 发送邮箱验证码
  const handleSendEmailCode = async () => {
    const newEmail = email.trim();
    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      showError("发送失败", "请输入有效的邮箱地址");
      return;
    }

    if (newEmail === user?.email) {
      showError("发送失败", "新邮箱与当前邮箱相同");
      return;
    }

    setIsSendingEmailCode(true);
    try {
      await sendVerificationCode({
        email: newEmail,
        type: "change_email",
      });
      showSuccess("发送成功", "验证码已发送到新邮箱");
      setEmailCountdown(60);
    } catch (error: any) {
      showError("发送失败", error.message || "验证码发送失败，请稍后重试");
    } finally {
      setIsSendingEmailCode(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!nickname.trim()) {
      showError("保存失败", "昵称不能为空");
      return;
    }

    // 如果修改了邮箱，需要验证码
    const newEmail = email.trim();
    if (newEmail && newEmail !== user?.email) {
      if (!emailVerificationCode || emailVerificationCode.length !== 6) {
        showError("保存失败", "请输入6位邮箱验证码");
        return;
      }
    }

    try {
      setSavingProfile(true);

      // 调用更新个人信息接口
      await usersApi.updateProfile({
        nickname: nickname.trim(),
        email: newEmail !== user?.email ? newEmail : undefined,
        emailVerificationCode:
          newEmail !== user?.email ? emailVerificationCode : undefined,
      });

      // 刷新用户信息
      if ("refreshUser" in auth && typeof auth.refreshUser === "function") {
        await auth.refreshUser();
      }

      showSuccess("更新成功", "个人信息已更新");
      setEmailVerificationCode("");
    } catch (err: any) {
      showError("更新失败", err.message || "更新失败");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      showError("请填写所有密码字段");
      return;
    }

    if (newPassword !== confirmPassword) {
      showError("两次输入的新密码不一致");
      return;
    }

    if (newPassword.length < 6) {
      showError("新密码至少需要6个字符");
      return;
    }

    // 密码强度验证
    if (!/^(?=.*[A-Za-z])(?=.*\d)/.test(newPassword)) {
      showError("密码必须包含字母和数字");
      return;
    }

    try {
      setSavingPassword(true);

      // 调用修改密码接口
      await usersApi.changePassword({
        oldPassword,
        newPassword,
      });

      showSuccess("密码修改成功");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      showError(err.response?.data?.message || "修改失败");
    } finally {
      setSavingPassword(false);
    }
  };

  // 复制邀请码
  const handleCopyInviteCode = async () => {
    if (user?.inviteCode) {
      const { copyToClipboard } = await import("../../utils/clipboard");
      const success = await copyToClipboard(user.inviteCode);

      if (success) {
        setCopiedInviteCode(true);
        showSuccess("邀请码已复制");
        setTimeout(() => setCopiedInviteCode(false), 2000);
      } else {
        showError("复制失败，请手动复制");
      }
    }
  };

  // 复制邀请链接
  const handleCopyInviteLink = async () => {
    if (user?.inviteCode) {
      const inviteLink = `${window.location.origin}/register?inviteCode=${user.inviteCode}`;
      const { copyToClipboard } = await import("../../utils/clipboard");
      const success = await copyToClipboard(inviteLink);

      if (success) {
        showSuccess("邀请链接已复制");
      } else {
        showError("复制失败，请手动复制");
      }
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 sm:p-6 md:p-8 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white/95 backdrop-blur-xl border border-white/50 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 - 固定 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200/50 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">个人设置</h2>
            <p className="text-sm text-gray-500 mt-1">
              管理您的账户信息和安全设置
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tab 导航 - 固定，移动端适配 */}
        <div className="flex border-b border-gray-200/50 px-2 sm:px-6 pt-4 flex-shrink-0 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex-shrink-0 px-2 sm:px-4 py-2.5 font-medium transition-all relative ${
              activeTab === "profile"
                ? "text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
            title="基本信息"
          >
            <div className="flex items-center gap-1.5 sm:gap-2">
              <User className="w-4 h-4 flex-shrink-0" />
              <span className="text-xs sm:text-sm whitespace-nowrap">
                基本信息
              </span>
            </div>
            {activeTab === "profile" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("password")}
            className={`flex-shrink-0 px-2 sm:px-4 py-2.5 font-medium transition-all relative ${
              activeTab === "password"
                ? "text-purple-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
            title="修改密码"
          >
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Lock className="w-4 h-4 flex-shrink-0" />
              <span className="text-xs sm:text-sm whitespace-nowrap">
                修改密码
              </span>
            </div>
            {activeTab === "password" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("membership")}
            className={`flex-shrink-0 px-2 sm:px-4 py-2.5 font-medium transition-all relative ${
              activeTab === "membership"
                ? "text-yellow-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
            title="会员信息"
          >
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Crown className="w-4 h-4 flex-shrink-0" />
              <span className="text-xs sm:text-sm whitespace-nowrap">
                会员信息
              </span>
            </div>
            {activeTab === "membership" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-600 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("token-history")}
            className={`flex-shrink-0 px-2 sm:px-4 py-2.5 font-medium transition-all relative ${
              activeTab === "token-history"
                ? "text-green-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
            title="字数消耗"
          >
            <div className="flex items-center gap-1.5 sm:gap-2">
              <History className="w-4 h-4 flex-shrink-0" />
              <span className="text-xs sm:text-sm whitespace-nowrap">
                字数消耗
              </span>
            </div>
            {activeTab === "token-history" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600 rounded-full" />
            )}
          </button>
        </div>

        {/* 内容区 - 可滚动 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 用户ID卡片 - 所有 tab 都显示 */}
          <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100/50">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/20">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">
                {user?.nickname || user?.username}
              </div>
              <div className="text-sm text-gray-500 font-mono">
                ID: {user?.id}
              </div>
            </div>
          </div>

          {/* 基本信息 Tab */}
          {activeTab === "profile" && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                <span>基本信息</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 用户名 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    用户名
                  </label>
                  <input
                    type="text"
                    value={username}
                    disabled
                    className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
                  />
                </div>

                {/* 昵称 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    昵称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="请输入昵称"
                    className="w-full px-4 py-2.5 bg-white/50 border border-gray-200/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                {/* 邮箱 */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    邮箱
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="请输入邮箱"
                      className="w-full pl-10 pr-4 py-2.5 bg-white/50 border border-gray-200/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                  {email && email !== user?.email && (
                    <p className="mt-1 text-xs text-orange-600">
                      修改邮箱需要验证码
                    </p>
                  )}
                </div>

                {/* 邮箱验证码（仅在修改邮箱时显示） */}
                {email && email !== user?.email && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      邮箱验证码 <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={emailVerificationCode}
                        onChange={(e) =>
                          setEmailVerificationCode(
                            e.target.value.replace(/\D/g, "").slice(0, 6)
                          )
                        }
                        maxLength={6}
                        placeholder="请输入6位验证码"
                        className="flex-1 px-4 py-2.5 bg-white/50 border border-gray-200/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                      <button
                        type="button"
                        onClick={handleSendEmailCode}
                        disabled={isSendingEmailCode || emailCountdown > 0}
                        className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center gap-2"
                      >
                        {isSendingEmailCode ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="hidden sm:inline">发送中</span>
                          </>
                        ) : emailCountdown > 0 ? (
                          <span>{emailCountdown}秒</span>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span className="hidden sm:inline">获取验证码</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 邀请码卡片 */}
              {user?.inviteCode && (
                <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200/50">
                  <div className="flex items-center space-x-2 mb-3">
                    <Gift className="w-5 h-5 text-purple-600" />
                    <h4 className="font-semibold text-gray-900">我的邀请码</h4>
                  </div>

                  <div className="bg-white/80 rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between">
                      <div className="font-mono text-2xl font-bold text-purple-600">
                        {user.inviteCode}
                      </div>
                      <button
                        onClick={handleCopyInviteCode}
                        className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
                        title="复制邀请码"
                      >
                        {copiedInviteCode ? (
                          <Check className="w-5 h-5 text-green-600" />
                        ) : (
                          <Copy className="w-5 h-5 text-purple-600" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleCopyInviteLink}
                    className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center space-x-2"
                  >
                    <Copy className="w-4 h-4" />
                    <span>复制邀请链接</span>
                  </button>

                  <p className="mt-3 text-xs text-gray-600 text-center">
                    邀请好友注册，您可获得{" "}
                    <span className="font-bold text-purple-600">8,000 字</span>{" "}
                    奖励
                    <br />
                    好友可获得{" "}
                    <span className="font-bold text-purple-600">
                      80,000 字
                    </span>{" "}
                    奖励
                  </p>
                </div>
              )}

              <button
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="w-full sm:w-auto px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {savingProfile ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>保存中...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>保存基本信息</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* 修改密码 Tab */}
          {activeTab === "password" && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
                <span>修改密码</span>
              </h3>

              <div className="space-y-4">
                {/* 旧密码 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    当前密码 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="请输入当前密码"
                      className="w-full pl-10 pr-4 py-2.5 bg-white/50 border border-gray-200/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 新密码 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      新密码 <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="至少6个字符"
                        className="w-full pl-10 pr-4 py-2.5 bg-white/50 border border-gray-200/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                  </div>

                  {/* 确认新密码 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      确认新密码 <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="再次输入新密码"
                        className="w-full pl-10 pr-4 py-2.5 bg-white/50 border border-gray-200/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleChangePassword}
                disabled={savingPassword}
                className="w-full sm:w-auto px-6 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {savingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>修改中...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>修改密码</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* 会员信息 Tab */}
          {activeTab === "membership" && <MembershipTab />}

          {/* 字数消耗历史 Tab */}
          {activeTab === "token-history" && <TokenHistoryTab />}
        </div>
      </div>
    </div>
  );

  // 使用 Portal 渲染到 body，确保模态框在最顶层
  return createPortal(modalContent, document.body);
};

export default UserSettingsModal;
