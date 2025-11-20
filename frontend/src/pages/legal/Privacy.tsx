import React from "react";
import { Link } from "react-router-dom";
import { Cloud, ArrowLeft, Shield, Lock, Eye, Database } from "lucide-react";

const Privacy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* 导航栏 */}
      <nav className="bg-white/80 backdrop-blur-lg shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-3">
              <Cloud className="w-8 h-8 text-primary-600" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                云墨写作
              </h1>
            </div>
            <div className="flex items-center">
              <Link
                to="/"
                className="flex items-center gap-2 text-gray-700 hover:text-primary-600 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                返回首页
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-10 h-10 text-primary-600" />
            <h1 className="text-4xl font-bold text-gray-900">隐私政策</h1>
          </div>
          <p className="text-gray-600 mb-8">
            最后更新时间：{new Date().toLocaleDateString("zh-CN")}
          </p>

          <div className="prose prose-lg max-w-none">
            {/* 引言 */}
            <section className="mb-8 bg-primary-50 rounded-xl p-6">
              <p className="text-gray-700 leading-relaxed">
                云墨（以下简称"我们"）深知个人信息对您的重要性，我们将按照法律法规要求，采取相应的安全保护措施，尽力保护您的个人信息安全可控。本隐私政策将帮助您了解：
              </p>
              <ul className="list-disc pl-6 mt-4 space-y-2 text-gray-700">
                <li>我们收集哪些信息</li>
                <li>我们如何使用这些信息</li>
                <li>我们如何保护您的信息</li>
                <li>您拥有哪些权利</li>
              </ul>
            </section>

            {/* 1. 我们收集的信息 */}
            <section className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Database className="w-6 h-6 text-primary-600" />
                <h2 className="text-2xl font-bold text-gray-900">1. 我们收集的信息</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">1.1 账号信息</h3>
                  <div className="bg-gray-50 rounded-lg p-4 text-gray-700">
                    <p>注册账号时，我们会收集：</p>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>用户名</li>
                      <li>电子邮件地址</li>
                      <li>密码（加密存储）</li>
                      <li>昵称（可选）</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">1.2 创作内容</h3>
                  <div className="bg-gray-50 rounded-lg p-4 text-gray-700">
                    <p>使用本平台时，我们会存储：</p>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>您创作的小说内容</li>
                      <li>提示词和角色卡</li>
                      <li>与AI的对话记录（用于提供服务）</li>
                      <li>上传的封面图片</li>
                    </ul>
                    <p className="mt-3 font-semibold text-primary-700">
                      重要：您的创作内容完全私有，我们不会分享给第三方或用于AI训练。
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">1.3 使用数据</h3>
                  <div className="bg-gray-50 rounded-lg p-4 text-gray-700">
                    <p>为了提供更好的服务，我们会收集：</p>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>登录时间和IP地址</li>
                      <li>设备信息（浏览器类型、操作系统）</li>
                      <li>功能使用情况（用于改进产品）</li>
                      <li>错误日志（用于排查问题）</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. 信息使用 */}
            <section className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Eye className="w-6 h-6 text-primary-600" />
                <h2 className="text-2xl font-bold text-gray-900">2. 信息使用</h2>
              </div>
              
              <div className="space-y-4 text-gray-700">
                <p>我们使用收集的信息用于：</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>提供服务：</strong>存储您的创作内容，提供AI辅助功能</li>
                  <li><strong>账号管理：</strong>验证身份，保护账号安全</li>
                  <li><strong>改进产品：</strong>分析使用情况，优化功能</li>
                  <li><strong>客户支持：</strong>响应您的咨询和反馈</li>
                  <li><strong>安全保障：</strong>检测和防范安全威胁</li>
                </ul>
                
                <div className="bg-green-50 border-l-4 border-green-500 p-4 mt-4">
                  <p className="font-semibold text-green-800">
                    ✓ 我们不会将您的个人信息出售给第三方
                  </p>
                  <p className="text-green-700 mt-1">
                    ✓ 您的创作内容不会用于AI训练或公开展示（除非您主动分享）
                  </p>
                </div>
              </div>
            </section>

            {/* 3. 信息保护 */}
            <section className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Lock className="w-6 h-6 text-primary-600" />
                <h2 className="text-2xl font-bold text-gray-900">3. 信息保护</h2>
              </div>
              
              <div className="space-y-4 text-gray-700">
                <p>我们采取以下措施保护您的信息安全：</p>
                
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">技术保护</h4>
                    <ul className="text-sm space-y-1 text-blue-800">
                      <li>• 密码加密存储</li>
                      <li>• 数据库访问控制</li>
                      <li>• 定期安全审计</li>
                    </ul>
                  </div>
                  
                  <div className="bg-purple-50 rounded-lg p-4">
                    <h4 className="font-semibold text-purple-900 mb-2">管理保护</h4>
                    <ul className="text-sm space-y-1 text-purple-800">
                      <li>• 员工权限最小化</li>
                      <li>• 保密协议约束</li>
                      <li>• 定期培训</li>
                      <li>• 访问日志记录</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mt-4">
                  <p className="font-semibold text-orange-800">
                    ⚠️ 安全提醒
                  </p>
                  <p className="text-orange-700 mt-1">
                    请妥善保管您的账号密码，不要与他人分享。我们不会以任何方式索要您的密码。
                  </p>
                </div>
              </div>
            </section>

            {/* 4. 信息共享 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. 信息共享</h2>
              <div className="space-y-4 text-gray-700">
                <p>我们不会向第三方出售或出租您的个人信息。在以下情况下，我们可能会共享您的信息：</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>征得同意：</strong>获得您的明确同意后</li>
                  <li><strong>法律要求：</strong>根据法律法规、诉讼、政府要求</li>
                  <li><strong>服务提供：</strong>与提供云存储等服务的合作伙伴（签订保密协议）</li>
                  <li><strong>保护权益：</strong>为保护用户或公众的人身财产安全</li>
                </ul>
              </div>
            </section>

            {/* 5. 您的权利 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. 您的权利</h2>
              <div className="space-y-4 text-gray-700">
                <p>关于您的个人信息，您拥有以下权利：</p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">✓ 访问权</h4>
                    <p className="text-sm">查看您在平台上的个人信息</p>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">✓ 更正权</h4>
                    <p className="text-sm">修改不准确或不完整的信息</p>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">✓ 删除权</h4>
                    <p className="text-sm">请求删除您的个人信息</p>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">✓ 注销权</h4>
                    <p className="text-sm">注销账号并删除所有数据</p>
                  </div>
                </div>

                <p className="mt-4">
                  如需行使上述权利，请通过本页面底部的联系方式与我们联系。
                </p>
              </div>
            </section>

            {/* 6. Cookie使用 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Cookie 和类似技术</h2>
              <div className="space-y-4 text-gray-700">
                <p>我们使用 Cookie 和类似技术来：</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>保持登录状态</li>
                  <li>记住您的偏好设置</li>
                  <li>分析网站访问情况</li>
                </ul>
                <p>您可以通过浏览器设置管理 Cookie，但这可能影响某些功能的使用。</p>
              </div>
            </section>

            {/* 7. 未成年人保护 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. 未成年人保护</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  我们重视未成年人的个人信息保护。如果您是未成年人，请在监护人的陪同下阅读本政策，并在监护人同意后使用我们的服务。
                </p>
                <p>
                  如果我们发现在未获监护人同意的情况下收集了未成年人的个人信息，我们将尽快删除相关数据。
                </p>
              </div>
            </section>

            {/* 8. 政策更新 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. 政策更新</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  我们可能适时修订本隐私政策。政策更新后，我们会在本页面发布新版本，并通过站内通知等方式提醒您。重大变更时，我们会提前通知您。
                </p>
                <p>
                  继续使用我们的服务，即表示您同意接受修订后的隐私政策。
                </p>
              </div>
            </section>

            {/* 联系方式 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">联系我们</h2>
              <div className="bg-gray-50 rounded-lg p-6 text-gray-700">
                <p className="mb-4">
                  如您对本隐私政策有任何疑问、意见或建议，或需要行使您的权利，请通过以下方式联系我们：
                </p>
                <div className="space-y-2">
                  <p><strong>邮箱：</strong>232107487@qq.com</p>
                </div>
                <p className="mt-4 text-sm text-gray-600">
                  我们将在15个工作日内回复您的请求。
                </p>
              </div>
            </section>
          </div>

          {/* 底部 */}
          <div className="mt-12 pt-8 border-t border-gray-200 text-center">
            <p className="text-gray-600">
              使用云墨即表示您同意本隐私政策
            </p>
            <Link
              to="/"
              className="inline-block mt-4 text-primary-600 hover:text-primary-700 font-medium"
            >
              返回首页
            </Link>
          </div>
        </div>
      </main>

      {/* 页脚 */}
      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} 云墨. 保留所有权利.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Privacy;
