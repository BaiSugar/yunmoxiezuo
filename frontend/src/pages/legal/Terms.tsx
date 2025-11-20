import React from "react";
import { Link } from "react-router-dom";
import { Cloud, ArrowLeft } from "lucide-react";

const Terms: React.FC = () => {
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">服务条款</h1>
          <p className="text-gray-600 mb-8">
            最后更新时间：{new Date().toLocaleDateString("zh-CN")}
          </p>

          <div className="prose prose-lg max-w-none">
            {/* 欢迎部分 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">欢迎使用云墨</h2>
              <p className="text-gray-700 leading-relaxed">
                感谢您选择云墨（以下简称"本平台"）。在使用本平台提供的服务之前，请您仔细阅读并理解本服务条款。您使用本平台的服务，即表示您同意接受本服务条款的全部内容。
              </p>
            </section>

            {/* 1. 服务说明 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. 服务说明</h2>
              <div className="space-y-4 text-gray-700">
                <p>云墨是一个AI辅助小说创作平台，为用户提供：</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>智能写作辅助工具</li>
                  <li>小说创作与管理功能</li>
                  <li>云端存储与同步服务</li>
                  <li>提示词与角色卡管理</li>
                </ul>
                <p className="font-semibold text-primary-700">
                  重要声明：AI仅作为辅助工具，创作的内容由用户完全主导和控制。
                </p>
              </div>
            </section>

            {/* 2. 用户责任 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. 用户责任</h2>
              <div className="space-y-4 text-gray-700">
                <p>使用本平台时，您需要：</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>提供真实、准确的注册信息</li>
                  <li>妥善保管账号和密码</li>
                  <li>对账号下的所有活动承担责任</li>
                  <li>不得将账号转让或出借给他人</li>
                </ul>
              </div>
            </section>

            {/* 3. 内容规范 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. 内容规范</h2>
              <div className="space-y-4 text-gray-700">
                <p>您在本平台创作或发布的内容不得：</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>违反国家法律法规</li>
                  <li>侵犯他人知识产权</li>
                  <li>包含色情、暴力、恐怖等不良信息</li>
                  <li>包含虚假、误导性信息</li>
                  <li>侵害他人隐私或名誉</li>
                </ul>
              </div>
            </section>

            {/* 4. 知识产权 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. 知识产权</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  <strong>用户内容：</strong>您在本平台创作的内容，其知识产权归您所有。您授予本平台在必要范围内使用这些内容的权利（如存储、备份、展示等）。
                </p>
                <p>
                  <strong>平台内容：</strong>本平台的界面设计、功能设计、软件代码等知识产权归本平台所有。
                </p>
              </div>
            </section>

            {/* 5. 服务变更 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. 服务变更与终止</h2>
              <div className="space-y-4 text-gray-700">
                <p>本平台保留以下权利：</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>根据需要修改或中断服务</li>
                  <li>对违规用户暂停或终止服务</li>
                  <li>定期维护和升级系统</li>
                </ul>
                <p>我们将提前通过平台公告等方式通知重大变更。</p>
              </div>
            </section>

            {/* 6. 免责声明 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. 免责声明</h2>
              <div className="space-y-4 text-gray-700">
                <p>对于以下情况造成的损失，本平台不承担责任：</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>不可抗力（如自然灾害、战争等）</li>
                  <li>用户自身原因（如密码泄露、误操作等）</li>
                  <li>第三方服务故障（如网络中断、云服务故障等）</li>
                  <li>AI生成内容的准确性和适用性</li>
                </ul>
                <p className="font-semibold text-orange-600">
                  AI生成的内容仅供参考，用户应自行判断和修改，并对最终发布的内容负责。
                </p>
              </div>
            </section>

            {/* 7. 争议解决 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. 争议解决</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  本服务条款的解释、适用及争议的解决均适用中华人民共和国法律。如发生争议，双方应友好协商解决；协商不成的，任何一方均可向本平台所在地人民法院提起诉讼。
                </p>
              </div>
            </section>

            {/* 8. 条款更新 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. 条款更新</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  本平台有权根据需要修订本服务条款，修订后的条款将在本页面公布。继续使用本平台服务，即表示您同意接受修订后的条款。
                </p>
              </div>
            </section>

            {/* 联系方式 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">联系我们</h2>
              <div className="space-y-4 text-gray-700">
                <p>如您对本服务条款有任何疑问，请通过以下方式联系我们：</p>
                <p>
                  邮箱：2323107487@qq.com
                </p>
              </div>
            </section>
          </div>

          {/* 底部 */}
          <div className="mt-12 pt-8 border-t border-gray-200 text-center">
            <p className="text-gray-600">
              使用云墨即表示您同意本服务条款
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

export default Terms;
