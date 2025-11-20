import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, ArrowRight, Feather } from "lucide-react";
import Footer from "../../components/common/Footer";

const Home: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* 导航栏 */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-lg shadow-sm z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-3">
              <img src="/logo.svg" alt="Logo" className="w-8 h-8" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                云墨写作
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-700 hover:text-primary-600 transition-colors"
              >
                登录
              </Link>
              <Link to="/register" className="btn-primary">
                开始创作
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <main className="pt-16">
        {/* 英雄区域 */}
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
          {/* 动态背景 */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-primary-50">
            <div className="absolute top-20 left-10 w-72 h-72 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
            <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
          </div>

          <div
            className={`relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 transition-all duration-1000 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            <div className="text-center">
              {/* 标语徽章 */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 rounded-full mb-6 animate-fade-in">
                <Sparkles className="w-4 h-4 text-primary-600" />
                <span className="text-sm font-medium text-primary-700">
                  AI 只是工具，创意源自于你
                </span>
              </div>

              <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-primary-800 to-gray-900 bg-clip-text text-transparent animate-fade-in-up">
                云端笔墨
                <br />
                <span className="text-4xl md:text-6xl">书写你的故事</span>
              </h1>

              <p className="text-xl md:text-2xl mb-12 text-gray-600 max-w-3xl mx-auto animate-fade-in-up animation-delay-200">
                专业的小说创作平台，AI 提供灵感，您掌握笔锋
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up animation-delay-400">
                <Link
                  to="/register"
                  className="group bg-gradient-to-r from-primary-600 to-primary-700 text-white px-10 py-4 rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  免费开始创作
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/login"
                  className="bg-white text-gray-900 px-10 py-4 rounded-xl font-semibold hover:bg-gray-50 border-2 border-gray-200 hover:border-primary-300 hover:shadow-lg transition-all duration-300"
                >
                  立即登录
                </Link>
              </div>

              {/* 理念说明 */}
              <div className="mt-16 flex flex-col items-center gap-4 animate-fade-in animation-delay-600">
                <div className="flex items-center gap-2 text-gray-500">
                  <Feather className="w-5 h-5" />
                  <p className="text-sm">工具赋能创作，人类定义灵魂</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA区域 */}
        <section className="relative py-32 overflow-hidden">
          {/* 渐变背景 */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-purple-800"></div>

          {/* 动态装饰元素 */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl"></div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-white" />
              <span className="text-sm font-medium text-white">
                开启创作新纪元
              </span>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              准备开始您的AI写作之旅？
            </h2>
            <p className="text-xl mb-10 text-white/90 max-w-2xl mx-auto">
              立即注册，让AI成为您的创作伙伴
            </p>

            <Link
              to="/register"
              className="group inline-flex items-center gap-2 bg-white text-primary-700 px-10 py-4 rounded-xl font-semibold hover:bg-gray-50 hover:shadow-2xl hover:scale-105 transition-all duration-300"
            >
              免费开始使用
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </section>
      </main>

      {/* 页脚 */}
      <footer className="relative bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <img src="/logo.svg" alt="Logo" className="w-8 h-8" />
              <h3 className="text-3xl font-bold bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">
                云墨
              </h3>
            </div>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              工具赋能创作，人类定义灵魂
            </p>

            {/* 联系方式 - QQ群和微信 */}
            <Footer className="mb-8" />

            {/* 链接区域 */}
            <div className="flex justify-center gap-6 mb-8 text-sm">
              <Link
                to="/terms"
                className="text-gray-400 hover:text-white transition-colors"
              >
                服务条款
              </Link>
              <span className="text-gray-600">|</span>
              <Link
                to="/privacy"
                className="text-gray-400 hover:text-white transition-colors"
              >
                隐私政策
              </Link>
            </div>

            <div className="pt-8 border-t border-gray-800">
              <p className="text-gray-500 text-sm">
                © 2025 云墨. 保留所有权利.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
