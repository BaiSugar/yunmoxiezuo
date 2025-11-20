import React, { useState, useRef, useEffect } from "react";
import {
  HelpCircle,
  Edit3,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  Code,
  FileText,
  Zap,
  Book,
  ChevronDown,
  ChevronRight,
  Sparkles,
  PlayCircle,
} from "lucide-react";

/**
 * 一键成书帮助页面
 * 左侧树状导航 + 右侧内容
 */
const BookCreationHelpPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"user" | "author">("user");
  const [activeSection, setActiveSection] = useState("user-quick-start");
  const contentRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    // 使用setTimeout确保DOM已更新
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element && contentRef.current) {
        // 获取右侧内容容器
        const container = contentRef.current;

        // 使用getBoundingClientRect计算相对位置
        const containerRect = container.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        const scrollTop = container.scrollTop;

        // 计算元素相对于容器的位置
        const elementTop = scrollTop + elementRect.top - containerRect.top - 20; // 20px偏移，避免紧贴顶部

        // 滚动右侧内容容器
        container.scrollTo({
          top: elementTop,
          behavior: "smooth",
        });
      }
    }, 100);
  };

  // 监听滚动，自动更新activeSection
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;

      const container = contentRef.current;
      const scrollTop = container.scrollTop + 100; // 100px偏移，提前激活

      // 获取所有section
      const sections = container.querySelectorAll("section[id]");
      let currentSection = "";

      sections.forEach((section) => {
        const element = section as HTMLElement;
        const elementTop = element.offsetTop;
        if (scrollTop >= elementTop) {
          currentSection = element.id;
        }
      });

      if (currentSection && currentSection !== activeSection) {
        setActiveSection(currentSection);
      }
    };

    const container = contentRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [activeSection]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* 头部 */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-center py-8 shadow-xl">
        <HelpCircle className="w-12 h-12 mx-auto mb-3" />
        <h1 className="text-3xl font-bold mb-2">一键成书系统 - 帮助文档</h1>
        <p className="text-purple-100">快速了解如何使用和编写提示词</p>
      </div>

      {/* Tab切换 */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex">
          <button
            onClick={() => {
              setActiveTab("user");
              setActiveSection("user-quick-start");
              // 滚动到第一个section
              setTimeout(() => {
                scrollToSection("user-quick-start");
              }, 150);
            }}
            className={`flex-1 py-4 px-6 font-medium transition-all ${
              activeTab === "user"
                ? "text-purple-600 border-b-2 border-purple-600 bg-purple-50"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <FileText className="w-5 h-5" />
              <span>普通用户指南</span>
            </div>
          </button>
          <button
            onClick={() => {
              setActiveTab("author");
              setActiveSection("author-overview");
              // 滚动到第一个section
              setTimeout(() => {
                scrollToSection("author-overview");
              }, 150);
            }}
            className={`flex-1 py-4 px-6 font-medium transition-all ${
              activeTab === "author"
                ? "text-purple-600 border-b-2 border-purple-600 bg-purple-50"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Edit3 className="w-5 h-5" />
              <span>提示词作者指南</span>
            </div>
          </button>
        </div>
      </div>

      {/* 主体内容 */}
      <div className="max-w-7xl mx-auto flex gap-6 p-6">
        {/* 左侧导航 */}
        <aside className="w-64 flex-shrink-0 sticky top-20 h-fit z-40">
          <div className="bg-white rounded-lg shadow-lg p-4">
            <p className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Book className="w-5 h-5" />
              目录
            </p>
            {activeTab === "user" ? (
              <UserNavTree
                activeSection={activeSection}
                onNavigate={scrollToSection}
              />
            ) : (
              <AuthorNavTree
                activeSection={activeSection}
                onNavigate={scrollToSection}
              />
            )}
          </div>
        </aside>

        {/* 右侧内容 */}
        <main className="flex-1 min-w-0">
          <div
            ref={contentRef}
            className="bg-white rounded-lg shadow-lg p-8 max-h-[calc(100vh-200px)] overflow-y-auto"
            style={{ scrollBehavior: "smooth" }}
          >
            {activeTab === "user" ? <UserGuide /> : <PromptAuthorGuide />}
          </div>
        </main>
      </div>
    </div>
  );
};

/**
 * 用户指南导航树
 */
const UserNavTree: React.FC<{
  activeSection: string;
  onNavigate: (id: string) => void;
}> = ({ activeSection, onNavigate }) => {
  const [expandedItems, setExpandedItems] = useState<string[]>([
    "stages-group",
  ]);

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const isExpanded = (id: string) => expandedItems.includes(id);

  return (
    <nav className="space-y-1 text-sm">
      <NavItem
        label="🚀 快速开始"
        id="user-quick-start"
        active={activeSection === "user-quick-start"}
        onClick={onNavigate}
      />

      <NavGroupItem
        label="📋 创作阶段详解"
        id="stages-group"
        expanded={isExpanded("stages-group")}
        onToggle={toggleExpand}
      >
        <NavItem
          label="阶段1：想法扩展"
          id="user-stage1"
          active={activeSection === "user-stage1"}
          onClick={onNavigate}
          indent
        />
        <NavItem
          label="阶段2：书名简介"
          id="user-stage2"
          active={activeSection === "user-stage2"}
          onClick={onNavigate}
          indent
        />
        <NavItem
          label="阶段3：大纲生成"
          id="user-stage3"
          active={activeSection === "user-stage3"}
          onClick={onNavigate}
          indent
        />
        <NavItem
          label="阶段4：章节正文"
          id="user-stage4"
          active={activeSection === "user-stage4"}
          onClick={onNavigate}
          indent
        />
        <NavItem
          label="阶段5：审稿优化"
          id="user-stage5"
          active={activeSection === "user-stage5"}
          onClick={onNavigate}
          indent
        />
      </NavGroupItem>

      <NavItem
        label="📝 章节生成流程"
        id="user-chapter-flow"
        active={activeSection === "user-chapter-flow"}
        onClick={onNavigate}
      />
      <NavItem
        label="❓ 常见问题"
        id="user-faq"
        active={activeSection === "user-faq"}
        onClick={onNavigate}
      />
      <NavItem
        label="💡 使用技巧"
        id="user-tips"
        active={activeSection === "user-tips"}
        onClick={onNavigate}
      />
      <NavItem
        label="⚠️ 注意事项"
        id="user-notice"
        active={activeSection === "user-notice"}
        onClick={onNavigate}
      />
    </nav>
  );
};

/**
 * 作者指南导航树
 */
const AuthorNavTree: React.FC<{
  activeSection: string;
  onNavigate: (id: string) => void;
}> = ({ activeSection, onNavigate }) => {
  const [expandedItems, setExpandedItems] = useState<string[]>([
    "prompts-group",
  ]);

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const isExpanded = (id: string) => expandedItems.includes(id);

  return (
    <nav className="space-y-1 text-sm">
      <NavItem
        label="📝 提示词编写概述"
        id="author-overview"
        active={activeSection === "author-overview"}
        onClick={onNavigate}
      />

      <NavGroupItem
        label="📋 12个提示词详解"
        id="prompts-group"
        expanded={isExpanded("prompts-group")}
        onToggle={toggleExpand}
      >
        <NavItem
          label="1. 脑洞生成"
          id="author-stage1-idea"
          active={activeSection === "author-stage1-idea"}
          onClick={onNavigate}
          indent
        />
        <NavItem
          label="2. 脑洞优化"
          id="author-stage1-optimize"
          active={activeSection === "author-stage1-optimize"}
          onClick={onNavigate}
          indent
        />
        <NavItem
          label="3. 书名简介生成"
          id="author-stage2"
          active={activeSection === "author-stage2"}
          onClick={onNavigate}
          indent
        />
        <NavItem
          label="4. 主大纲生成"
          id="author-stage3a"
          active={activeSection === "author-stage3a"}
          onClick={onNavigate}
          indent
        />
        <NavItem
          label="5. 主大纲优化"
          id="author-stage3a-optimize"
          active={activeSection === "author-stage3a-optimize"}
          onClick={onNavigate}
          indent
        />
        <NavItem
          label="6. 卷大纲生成"
          id="author-stage3b"
          active={activeSection === "author-stage3b"}
          onClick={onNavigate}
          indent
        />
        <NavItem
          label="7. 卷大纲优化"
          id="author-stage3b-optimize"
          active={activeSection === "author-stage3b-optimize"}
          onClick={onNavigate}
          indent
        />
        <NavItem
          label="8. 章节大纲生成"
          id="author-stage3c"
          active={activeSection === "author-stage3c"}
          onClick={onNavigate}
          indent
        />
        <NavItem
          label="9. 章节大纲优化"
          id="author-stage3c-optimize"
          active={activeSection === "author-stage3c-optimize"}
          onClick={onNavigate}
          indent
        />
        <NavItem
          label="10. 章节正文生成"
          id="author-stage4"
          active={activeSection === "author-stage4"}
          onClick={onNavigate}
          indent
        />
        <NavItem
          label="11. 审稿"
          id="author-stage5-review"
          active={activeSection === "author-stage5-review"}
          onClick={onNavigate}
          indent
        />
        <NavItem
          label="12. 正文优化"
          id="author-stage5-optimize"
          active={activeSection === "author-stage5-optimize"}
          onClick={onNavigate}
          indent
        />
      </NavGroupItem>

      <NavItem
        label="📊 格式要求总结"
        id="author-format-summary"
        active={activeSection === "author-format-summary"}
        onClick={onNavigate}
      />
      <NavItem
        label="🔄 参数映射表"
        id="author-param-mapping"
        active={activeSection === "author-param-mapping"}
        onClick={onNavigate}
      />
      <NavItem
        label="⚠️ 常见错误"
        id="author-errors"
        active={activeSection === "author-errors"}
        onClick={onNavigate}
      />
      <NavItem
        label="✨ 最佳实践"
        id="author-best-practices"
        active={activeSection === "author-best-practices"}
        onClick={onNavigate}
      />
    </nav>
  );
};

/**
 * 导航项组件
 */
const NavItem: React.FC<{
  label: string;
  id: string;
  active: boolean;
  onClick: (id: string) => void;
  indent?: boolean;
}> = ({ label, id, active, onClick, indent }) => {
  return (
    <button
      onClick={() => onClick(id)}
      className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
        indent ? "pl-8" : ""
      } ${
        active
          ? "bg-purple-100 text-purple-700 font-medium"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      }`}
    >
      {label}
    </button>
  );
};

/**
 * 导航分组项组件
 */
const NavGroupItem: React.FC<{
  label: string;
  id: string;
  expanded: boolean;
  onToggle: (id: string) => void;
  children: React.ReactNode;
}> = ({ label, id, expanded, onToggle, children }) => {
  return (
    <div>
      <button
        onClick={() => onToggle(id)}
        className="w-full text-left px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 font-medium flex items-center justify-between transition-all"
      >
        <span>{label}</span>
        {expanded ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </button>
      {expanded && <div className="mt-1 space-y-1">{children}</div>}
    </div>
  );
};

/**
 * 普通用户指南组件
 */
const UserGuide: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* 快速开始 */}
      <section id="user-quick-start">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Zap className="w-6 h-6 text-purple-600" />
          快速开始
        </h2>
        <div className="space-y-4">
          <StepItem number={1} title="创建任务">
            进入"一键成书"模块，点击"创建新任务"按钮
          </StepItem>
          <StepItem number={2} title="选择提示词组">
            从下拉列表选择一个提示词组（推荐使用"默认成书提示词组"）
          </StepItem>
          <StepItem number={3} title="填写参数">
            <p>如果提示词组需要参数，系统会自动显示参数配置表单：</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
              <li>故事类型：如"修仙"、"玄幻"、"都市"等</li>
              <li>主角设定：如"穿越者"、"重生者"、"天才"等</li>
              <li>其他自定义参数（根据提示词组而定）</li>
            </ul>
          </StepItem>
          <StepItem number={4} title="配置任务选项">
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>是否开启AI审稿：建议开启</li>
              <li>批量生成并发数：建议保持默认值5</li>
            </ul>
          </StepItem>
          <StepItem number={5} title="开始执行" completed>
            点击"创建任务"，系统会自动引导您逐步完成5个阶段
          </StepItem>
        </div>
      </section>

      {/* 阶段1：想法扩展 */}
      <section id="user-stage1">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-lg">
            阶段1
          </span>
          想法扩展（脑洞生成）
        </h2>

        <div className="space-y-4">
          <InfoBox type="info">
            <p className="font-medium mb-2">这个阶段做什么？</p>
            <p>
              根据您填写的参数（故事类型、主角设定等），AI会生成详细的故事构思（3-5段脑洞描述）。
            </p>
          </InfoBox>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <PlayCircle className="w-5 h-5" />
              操作步骤
            </h3>
            <ol className="list-decimal list-inside space-y-3 text-gray-700">
              <li>
                <strong>点击"开始执行阶段1"按钮</strong>
                <p className="ml-6 mt-1 text-sm text-gray-600">
                  系统会检测该阶段的提示词是否有用户参数
                </p>
              </li>
              <li>
                <strong>填写参数（如果需要）</strong>
                <p className="ml-6 mt-1 text-sm text-gray-600">
                  如果提示词有参数，会弹出配置窗口，显示您在创建任务时填写的值，可以修改后执行
                </p>
              </li>
              <li>
                <strong>等待生成</strong>
                <p className="ml-6 mt-1 text-sm text-gray-600">
                  系统会实时显示"生成中..."状态，通常需要10-30秒
                </p>
              </li>
              <li>
                <strong>查看结果</strong>
                <p className="ml-6 mt-1 text-sm text-gray-600">
                  生成完成后会显示3-5段脑洞内容
                </p>
              </li>
              <li>
                <strong>选择操作</strong>
                <div className="ml-6 mt-2 space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1 bg-blue-500 text-white rounded text-xs">
                      继续下一阶段
                    </button>
                    <span className="text-gray-600">- 满意，进入阶段2</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1 bg-orange-500 text-white rounded text-xs">
                      优化
                    </button>
                    <span className="text-gray-600">
                      - 弹出反馈输入框，重新生成（使用优化提示词）
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1 bg-gray-500 text-white rounded text-xs">
                      手动编辑
                    </button>
                    <span className="text-gray-600">- 直接修改文本内容</span>
                  </div>
                </div>
              </li>
            </ol>
          </div>

          <TipBox type="success">
            <strong>提示：</strong>
            脑洞内容的质量直接影响后续所有阶段。如果对生成的脑洞不满意，建议多次优化直到满意再继续。
          </TipBox>
        </div>
      </section>

      {/* 阶段2：书名简介 */}
      <section id="user-stage2">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="bg-cyan-100 text-cyan-800 px-3 py-1 rounded-lg text-lg">
            阶段2
          </span>
          书名和简介生成
        </h2>

        <div className="space-y-4">
          <InfoBox type="info">
            <p className="font-medium mb-2">这个阶段做什么？</p>
            <p>
              系统会自动读取阶段1的脑洞内容，生成3-5个候选书名和200-300字的作品简介。
            </p>
          </InfoBox>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <PlayCircle className="w-5 h-5" />
              操作步骤
            </h3>
            <ol className="list-decimal list-inside space-y-3 text-gray-700">
              <li>
                <strong>点击"继续下一阶段"按钮</strong>
                <p className="ml-6 mt-1 text-sm text-gray-600">
                  系统会自动传入阶段1的脑洞内容，无需您手动填写
                </p>
              </li>
              <li>
                <strong>等待生成</strong>
                <p className="ml-6 mt-1 text-sm text-gray-600">
                  生成3-5个书名和简介，通常需要15-30秒
                </p>
              </li>
              <li>
                <strong>选择书名</strong>
                <p className="ml-6 mt-1 text-sm text-gray-600">
                  从候选书名中选择一个（默认选中第一个），也可以手动编辑
                </p>
              </li>
              <li>
                <strong>确认简介</strong>
                <p className="ml-6 mt-1 text-sm text-gray-600">
                  查看生成的简介，可以直接修改文本内容
                </p>
              </li>
              <li>
                <strong>继续或重新生成</strong>
                <p className="ml-6 mt-1 text-sm text-gray-600">
                  满意后点击"继续"，不满意可以点击"重新生成"
                </p>
              </li>
            </ol>
          </div>

          <TipBox type="success">
            <strong>提示：</strong>
            书名和简介会显示在作品列表中，是读者的第一印象，建议认真选择和修改。
          </TipBox>
        </div>
      </section>

      {/* 阶段3：大纲生成 */}
      <section id="user-stage3">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-lg">
            阶段3
          </span>
          大纲生成（三级结构）
        </h2>

        <div className="space-y-4">
          <InfoBox type="info">
            <p className="font-medium mb-2">这个阶段做什么？</p>
            <p>
              分三步生成完整大纲：主大纲（5-10个节点）→ 卷大纲（每个节点3-5卷）→
              章节大纲（每卷若干章节）
            </p>
          </InfoBox>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <PlayCircle className="w-5 h-5" />
              操作步骤
            </h3>
            <div className="space-y-4">
              <div>
                <p className="font-medium text-blue-700 mb-2">
                  第1步：生成主大纲
                </p>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                  <li>点击"开始执行阶段3"，系统开始生成主大纲</li>
                  <li>系统自动读取书名、简介、脑洞内容（您无需填写）</li>
                  <li>生成5-10个主要节点（如"开端"、"发展"、"高潮"等）</li>
                  <li>显示树形结构的第一级</li>
                </ol>
              </div>

              <div>
                <p className="font-medium text-purple-700 mb-2">
                  第2步：生成卷大纲
                </p>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                  <li>系统自动对每个主大纲节点生成分卷</li>
                  <li>实时显示进度："正在生成卷纲 1/5..."</li>
                  <li>每个节点生成3-5个卷</li>
                  <li>树形结构展开显示第二级（卷）</li>
                </ol>
              </div>

              <div>
                <p className="font-medium text-green-700 mb-2">
                  第3步：生成章节大纲
                </p>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                  <li>系统自动对每个卷生成章节大纲</li>
                  <li>
                    每章包含：标题、梗概、人物卡详情（含性别年龄身份性格等）、世界观详情、主要场景、情节点
                  </li>
                  <li>树形结构完整展开（三级）</li>
                </ol>
              </div>

              <div>
                <p className="font-medium text-yellow-700 mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  第4步：自动提取人物卡和世界观
                </p>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                  <li>
                    系统从章节大纲的characters和worldviews字段提取角色和世界观信息
                  </li>
                  <li>
                    自动创建人物卡和世界观实体（包含fields中的所有详细信息）
                  </li>
                  <li>显示提取结果："✓ 已自动创建 8 个人物卡、3 个世界观"</li>
                  <li>可点击"查看人物卡"/"查看世界观"按钮查看详情</li>
                </ol>
              </div>
            </div>
          </div>

          <TipBox type="success">
            <strong>提示：</strong>
            阶段3完成后，建议查看自动提取的人物卡和世界观。如果信息不完整，可以在作品编辑器中补充，这会让阶段4生成的正文更丰富。
          </TipBox>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mt-4">
            <p className="font-medium text-gray-800 mb-3 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-blue-600" />
              大纲生成的执行流程（循环处理）
            </p>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="bg-white rounded p-3">
                <p className="font-medium text-blue-700 mb-2">
                  问：大纲不是生成很多节点吗？系统是如何处理的？
                </p>
                <p className="mb-2">
                  <strong>答：</strong>
                  系统会逐个循环处理，而不是一次性把所有节点都传给提示词。
                </p>
                <div className="space-y-2 mt-3">
                  <div className="border-l-4 border-blue-400 pl-3">
                    <p className="font-medium text-blue-600">
                      阶段3a：主大纲生成
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      提示词执行1次 → 生成一个JSON数组（包含5-10个主节点）
                    </p>
                  </div>
                  <div className="border-l-4 border-purple-400 pl-3">
                    <p className="font-medium text-purple-600">
                      阶段3b：卷大纲生成（循环执行）
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      系统读取主大纲的JSON数组，假设有8个主节点，则：
                    </p>
                    <ul className="list-disc list-inside ml-4 mt-1 text-xs space-y-1">
                      <li>第1次：传入第1个节点的标题和内容 → 生成3-5个卷</li>
                      <li>第2次：传入第2个节点的标题和内容 → 生成3-5个卷</li>
                      <li>...</li>
                      <li>第8次：传入第8个节点的标题和内容 → 生成3-5个卷</li>
                    </ul>
                    <p className="text-xs text-gray-600 mt-1">
                      共执行8次，每次只传入一个节点的信息
                    </p>
                  </div>
                  <div className="border-l-4 border-green-400 pl-3">
                    <p className="font-medium text-green-600">
                      阶段3c：章节大纲生成（循环执行）
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      系统读取所有卷（假设共40个卷），则：
                    </p>
                    <ul className="list-disc list-inside ml-4 mt-1 text-xs space-y-1">
                      <li>第1次：传入第1个卷的标题和描述 → 生成若干章节</li>
                      <li>第2次：传入第2个卷的标题和描述 → 生成若干章节</li>
                      <li>...</li>
                      <li>第40次：传入第40个卷的标题和描述 → 生成若干章节</li>
                    </ul>
                    <p className="text-xs text-gray-600 mt-1">
                      共执行40次，每次只传入一个卷的信息
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <InfoBox type="warning" className="mt-4">
            <p className="font-medium mb-2">关于自动提取的人物卡和世界观</p>
            <p className="text-sm">
              系统会从章节大纲的characters和worldviews字段提取详细信息，自动创建对应的人物卡和世界观实体。
            </p>
            <p className="text-sm mt-2">
              <strong>人物卡包含：</strong>
              姓名、分类、性别、年龄、身份、性格、外貌、能力、背景等详细信息。
            </p>
            <p className="text-sm mt-2">
              <strong>世界观包含：</strong>
              名称、分类、世界类型、核心规则、地理环境、社会结构等详细信息。可以包括：世界设定、修炼体系、词条、物品（法宝、装备）、势力（门派、家族）等。
            </p>
          </InfoBox>
        </div>
      </section>

      {/* 阶段4：章节正文 */}
      <section id="user-stage4">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-lg text-lg">
            阶段4
          </span>
          章节正文生成
        </h2>

        <div className="space-y-4">
          <InfoBox type="info">
            <p className="font-medium mb-2">这个阶段做什么？</p>
            <p>
              系统会批量生成所有章节的正文内容（每章2000-3000字）。会自动使用阶段3生成的章节梗概、人物卡、世界观等信息。
            </p>
          </InfoBox>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <PlayCircle className="w-5 h-5" />
              操作步骤
            </h3>
            <ol className="list-decimal list-inside space-y-3 text-gray-700">
              <li>
                <strong>点击"继续下一阶段"按钮</strong>
                <p className="ml-6 mt-1 text-sm text-gray-600">
                  系统开始批量生成所有章节
                </p>
              </li>
              <li>
                <strong>观察实时进度</strong>
                <p className="ml-6 mt-1 text-sm text-gray-600">
                  进度条实时更新："已完成 5/50 章节"
                </p>
                <p className="ml-6 mt-1 text-sm text-gray-600">
                  章节列表显示状态：
                </p>
                <ul className="ml-10 mt-1 space-y-1 text-xs text-gray-500">
                  <li>✓ 已生成（可点击预览）</li>
                  <li>🔄 生成中...</li>
                  <li>⏳ 排队中</li>
                </ul>
              </li>
              <li>
                <strong>查看生成的章节</strong>
                <p className="ml-6 mt-1 text-sm text-gray-600">
                  点击已生成的章节可以预览正文内容
                </p>
              </li>
              <li>
                <strong>处理失败章节（如果有）</strong>
                <p className="ml-6 mt-1 text-sm text-gray-600">
                  如果某些章节生成失败，可以点击"重新生成失败章节"
                </p>
              </li>
              <li>
                <strong>选择下一步</strong>
                <div className="ml-6 mt-2 space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1 bg-blue-500 text-white rounded text-xs">
                      完成任务
                    </button>
                    <span className="text-gray-600">- 跳过审稿，直接完成</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1 bg-purple-500 text-white rounded text-xs">
                      继续审稿
                    </button>
                    <span className="text-gray-600">
                      - 进入阶段5，让AI审稿并优化
                    </span>
                  </div>
                </div>
              </li>
            </ol>
          </div>

          <InfoBox type="warning">
            <p className="font-medium mb-2">系统会传入什么信息？</p>
            <p className="text-sm">对于每一章，系统会自动传入：</p>
            <ul className="list-disc list-inside ml-4 mt-2 text-sm space-y-1">
              <li>该章的标题和梗概（阶段3生成的）</li>
              <li>前面章节的梗概（保持连贯性）</li>
              <li>
                <strong>该作品的所有人物卡</strong>
                （阶段3提取的 + 您创建的）
              </li>
              <li>
                <strong>该作品的所有世界观</strong>
                （阶段3提取的 + 您创建的）
              </li>
            </ul>
            <p className="mt-2 text-sm text-orange-700 font-medium">
              注意：传入所有人物卡可能导致AI写出不该出现的角色。提示词应强调"只使用本章梗概中提到的角色"。
            </p>
          </InfoBox>
        </div>
      </section>

      {/* 阶段5：审稿优化 */}
      <section id="user-stage5">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="bg-red-100 text-red-800 px-3 py-1 rounded-lg text-lg">
            阶段5
          </span>
          审稿优化（可选）
        </h2>

        <div className="space-y-4">
          <InfoBox type="info">
            <p className="font-medium mb-2">这个阶段做什么？</p>
            <p>
              AI会逐章审阅并生成审稿报告（评分、问题、建议），然后您可以选择优化低分章节。
            </p>
          </InfoBox>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <PlayCircle className="w-5 h-5" />
              操作步骤
            </h3>
            <ol className="list-decimal list-inside space-y-3 text-gray-700">
              <li>
                <strong>系统开始审稿</strong>
                <p className="ml-6 mt-1 text-sm text-gray-600">
                  AI逐章审阅，生成审稿报告
                </p>
              </li>
              <li>
                <strong>查看审稿报告</strong>
                <p className="ml-6 mt-1 text-sm text-gray-600">
                  每章显示评分（0-100分）和问题列表
                </p>
              </li>
              <li>
                <strong>选择优化方式</strong>
                <div className="ml-6 mt-2 space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1 bg-orange-500 text-white rounded text-xs">
                      批量优化低分章节
                    </button>
                    <span className="text-gray-600">
                      - 自动优化评分 &lt; 80的章节
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1 bg-blue-500 text-white rounded text-xs">
                      选择章节优化
                    </button>
                    <span className="text-gray-600">
                      - 手动勾选需要优化的章节
                    </span>
                  </div>
                </div>
              </li>
              <li>
                <strong>查看优化结果</strong>
                <p className="ml-6 mt-1 text-sm text-gray-600">
                  系统会保留优化前后的两个版本，可以对比选择
                </p>
              </li>
              <li>
                <strong>完成任务</strong>
                <p className="ml-6 mt-1 text-sm text-gray-600">
                  满意后点击"完成任务"
                </p>
              </li>
            </ol>
          </div>

          <TipBox type="success">
            <strong>提示：</strong>
            审稿阶段是可选的，如果想节省字数，可以在阶段4完成后直接结束任务。
          </TipBox>
        </div>
      </section>

      {/* 章节生成流程 */}
      <section id="user-chapter-flow">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Edit3 className="w-6 h-6 text-purple-600" />
          阶段4：章节是如何逐章生成的？
        </h2>

        <div className="space-y-4">
          <p className="text-gray-700">
            很多用户疑惑：阶段4批量生成章节时，如果生成了第一章，我觉得没问题，系统会怎么生成下一章？
          </p>

          <InfoBox type="info">
            <p className="font-medium mb-2">系统的批量生成流程：</p>
            <ol className="list-decimal list-inside ml-4 space-y-2">
              <li>
                <strong>并发生成：</strong>
                默认同时生成5章（可配置），而不是一章一章顺序生成
              </li>
              <li>
                <strong>独立处理：</strong>
                每一章的生成都是独立的，互不影响
              </li>
              <li>
                <strong>实时更新：</strong>
                每生成完一章，立即显示在页面上，您可以实时查看
              </li>
              <li>
                <strong>失败重试：</strong>
                如果某章生成失败，不影响其他章节，可以单独重新生成
              </li>
            </ol>
          </InfoBox>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
            <p className="font-medium text-gray-800 mb-3">详细流程举例：</p>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="bg-white rounded p-3">
                <p className="font-medium text-blue-700 mb-2">
                  假设一部小说有50章
                </p>
                <div className="space-y-2">
                  <p>
                    <strong>第1批（并发5章）：</strong>
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>同时生成第1、2、3、4、5章</li>
                    <li>
                      每章都会读取：该章梗概、前文梗概、所有人物卡、所有世界观
                    </li>
                    <li>
                      例如生成第3章时：
                      <ul className="list-circle list-inside ml-6 mt-1">
                        <li>当前章节梗概：第3章的梗概</li>
                        <li>前面章节梗概：第1章、第2章的梗概</li>
                        <li>人物卡：该作品的所有人物卡</li>
                        <li>世界观：该作品的所有世界观</li>
                      </ul>
                    </li>
                  </ul>
                  <p className="mt-2">
                    <strong>第2批（并发5章）：</strong>
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>第1批完成后，开始第6、7、8、9、10章</li>
                    <li>
                      例如生成第8章时：
                      <ul className="list-circle list-inside ml-6 mt-1">
                        <li>当前章节梗概：第8章的梗概</li>
                        <li>前面章节梗概：第1-7章的梗概</li>
                        <li>人物卡和世界观：不变，还是所有的</li>
                      </ul>
                    </li>
                  </ul>
                  <p className="mt-2">
                    <strong>依此类推...</strong>直到所有50章都生成完成
                  </p>
                </div>
              </div>

              <div className="bg-white rounded p-3">
                <p className="font-medium text-purple-700 mb-2">关键要点：</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    <strong>每章都是独立生成的：</strong>
                    系统会为每一章单独准备参数（该章梗概 + 前文梗概）
                  </li>
                  <li>
                    <strong>前文梗概会累积：</strong>
                    生成第10章时会读取前9章的梗概，确保连贯性
                  </li>
                  <li>
                    <strong>人物卡和世界观是全局的：</strong>
                    所有章节都会传入该作品的所有人物卡和世界观
                  </li>
                  <li>
                    <strong>无需人工干预：</strong>
                    整个过程自动进行，您只需等待完成
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <InfoBox type="warning">
            <p className="font-medium mb-2">注意：人物卡和世界观的问题</p>
            <p className="text-sm">
              系统会把该作品的<strong>所有</strong>
              人物卡和世界观都传给AI。如果作品有50个人物，但某章只涉及2-3个，可能导致AI写出不该出现的角色。
            </p>
            <p className="text-sm mt-2">
              <strong>解决办法：</strong>
              确保您的章节正文生成提示词中强调"只使用本章梗概中提到的角色和场景"。
            </p>
          </InfoBox>
        </div>
      </section>

      {/* 常见问题 */}
      <section id="user-faq">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-purple-600" />
          常见问题
        </h2>

        <div className="space-y-4">
          <FAQItem question="如果提示词有参数，我在哪里填写？">
            <p className="mb-2">有两个地方可以填写参数：</p>
            <ol className="list-decimal list-inside space-y-2">
              <li>
                <strong>创建任务时：</strong>
                在任务配置页面会自动显示所有需要的参数表单
              </li>
              <li>
                <strong>执行阶段时：</strong>
                点击"开始执行"按钮后，如果该阶段的提示词有用户自定义参数，会弹出参数配置窗口，您可以修改后再执行
              </li>
            </ol>
            <InfoBox type="info" className="mt-3">
              <strong>重要提示：</strong>
              您只需要填写"用户自定义参数"（如故事类型、主角设定）。系统会自动传递前面阶段的产出内容（如脑洞内容、章节梗概等），无需您手动填写。
            </InfoBox>
          </FAQItem>

          <FAQItem question="为什么执行失败了？">
            <p className="mb-2">常见原因：</p>
            <ul className="list-disc list-inside space-y-1">
              <li>字数包余额不足</li>
              <li>必填参数未填写</li>
              <li>提示词格式不正确（AI返回的不是JSON）</li>
              <li>网络问题或AI服务暂时不可用</li>
            </ul>
            <p className="mt-2">
              可以查看任务详情页的错误信息，或联系管理员查看日志。
            </p>
          </FAQItem>

          <FAQItem question="人物卡和世界观是怎么自动提取的？">
            <p>
              在阶段3（大纲生成）完成后，系统会自动从章节大纲的characters和worldviews字段提取详细信息（包括姓名、分类、fields中的所有属性），然后自动创建对应的人物卡和世界观实体。您可以在作品编辑器中查看和编辑这些内容。
            </p>
          </FAQItem>

          <FAQItem question="可以随时暂停任务吗？">
            <p>
              可以！任务详情页有"暂停"按钮，点击后系统会保存当前进度。您可以随时返回继续执行，不会丢失已生成的内容。
            </p>
          </FAQItem>

          <FAQItem question="生成的内容不满意怎么办？">
            <p className="mb-2">每个阶段都支持优化和手动编辑：</p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>优化：</strong>
                点击"优化"按钮，系统会使用优化提示词重新生成
              </li>
              <li>
                <strong>手动编辑：</strong>
                直接在文本框中修改内容，点击保存
              </li>
              <li>
                <strong>版本管理：</strong>
                每次优化都会保留旧版本，可以随时回滚
              </li>
            </ul>
          </FAQItem>

          <FAQItem question="任务完成后可以做什么？">
            <p className="mb-2">任务完成后，您可以：</p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>进入作品编辑器：</strong>
                继续编辑章节、管理人物卡、添加新章节
              </li>
              <li>
                <strong>导出作品：</strong>
                支持导出为TXT、Word、PDF格式
              </li>
              <li>
                <strong>查看统计：</strong>
                查看字数统计、创作时长等信息
              </li>
            </ul>
          </FAQItem>
        </div>
      </section>

      {/* 使用技巧 */}
      <section id="user-tips">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Lightbulb className="w-6 h-6 text-purple-600" />
          使用技巧
        </h2>

        <div className="space-y-3">
          <TipBox type="success">
            <strong>技巧1：选择合适的提示词组</strong>
            <p className="mt-1">
              不同的提示词组适合不同类型的小说。修仙小说建议使用"修仙专用提示词组"，都市小说使用"都市专用提示词组"，这样生成效果更好。
            </p>
          </TipBox>

          <TipBox type="success">
            <strong>技巧2：合理设置并发数</strong>
            <p className="mt-1">
              批量生成并发数建议设置为5。设置太高可能导致超时，设置太低会影响生成速度。
            </p>
          </TipBox>

          <TipBox type="success">
            <strong>技巧3：充分利用优化功能</strong>
            <p className="mt-1">
              每个阶段都可以优化。如果对生成内容不满意，不要直接进入下一阶段，先优化当前阶段的产出，这样后续阶段的质量会更好。
            </p>
          </TipBox>

          <TipBox type="success">
            <strong>技巧4：查看自动提取的人物卡</strong>
            <p className="mt-1">
              阶段3完成后，记得查看自动提取的人物卡和世界观。如果信息不完整，可以在作品编辑器中补充完善，这会让阶段4生成的正文更加丰富。
            </p>
          </TipBox>

          <TipBox type="warning">
            <strong>技巧5：保持字数包充足</strong>
            <p className="mt-1">
              一键成书会消耗大量字数。建议在开始前确保字数包余额充足，避免中途因余额不足而中断。或者开通会员，享受更低的字数价格。
            </p>
          </TipBox>
        </div>
      </section>

      {/* 注意事项 */}
      <section id="user-notice">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-purple-600" />
          注意事项
        </h2>

        <InfoBox type="warning">
          <p className="font-medium mb-2">参数配置说明</p>
          <div className="space-y-2 text-sm">
            <p>
              <strong>用户自定义参数：</strong>
              在创建任务时填写，如"故事类型"、"主角设定"等。
            </p>
            <p>
              <strong>系统自动参数：</strong>
              无需您填写，系统会自动从前面阶段的产出中获取，如"脑洞内容"、"章节梗概"、"人物卡列表"等。
            </p>
            <p className="text-red-600 font-medium">
              重要：如果执行阶段时弹出参数配置窗口，只需填写或确认用户自定义参数即可，系统自动参数会自动处理。
            </p>
          </div>
        </InfoBox>
      </section>
    </div>
  );
};

/**
 * 提示词作者指南组件
 */
const PromptAuthorGuide: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* 概述 */}
      <section id="author-overview">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Edit3 className="w-6 h-6 text-purple-600" />
          提示词编写概述
        </h2>

        <p className="mb-4">
          为一键成书系统编写提示词时，需要理解以下关键概念：
        </p>

        <div className="space-y-4">
          <ConceptBox title="1. 参数类型">
            <ul className="list-disc list-inside space-y-2">
              <li>
                <code className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                  用户自定义参数
                </code>
                ：由用户在创建任务时填写（如故事类型、主角设定）
              </li>
              <li>
                <code className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                  系统自动参数
                </code>
                ：由系统从前面阶段的产出中自动获取（如脑洞内容、章节梗概）
              </li>
            </ul>
          </ConceptBox>

          <ConceptBox title="2. 格式要求">
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong>结构化数据</strong>（书名、大纲、审稿报告）→{" "}
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-800 rounded text-sm font-medium">
                  必须要求JSON格式
                </span>
              </li>
              <li>
                <strong>纯文本内容</strong>（脑洞、章节正文）→{" "}
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-800 rounded text-sm font-medium">
                  直接返回文本
                </span>
              </li>
            </ul>
          </ConceptBox>

          <ConceptBox title="3. 参数占位符">
            <ul className="list-disc list-inside space-y-2">
              <li>
                使用{" "}
                <code className="bg-gray-100 px-2 py-0.5 rounded">
                  {"{{参数名}}"}
                </code>{" "}
                或{" "}
                <code className="bg-gray-100 px-2 py-0.5 rounded">
                  {"${参数名}"}
                </code>{" "}
                格式
              </li>
              <li>参数名必须与系统预定义的参数名完全匹配</li>
            </ul>
          </ConceptBox>
        </div>
      </section>

      {/* 12个提示词详解 - 完整补充 */}
      <section>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          📋 12个提示词详解
        </h2>
        <p className="text-gray-600 mb-6">
          一键成书系统包含12个提示词：5个生成提示词 +
          7个优化提示词。每个提示词都有特定的参数和格式要求。
        </p>

        <InfoBox type="info" className="mb-6">
          <p>
            <strong>说明：</strong>
            以下是所有12个提示词的详细说明，包括用途、参数、格式要求等。每个提示词都需要在提示词市场中创建。
          </p>
        </InfoBox>

        <div className="space-y-6">
          {/* 生成提示词组 */}
          <div>
            <h3 className="text-xl font-bold text-blue-800 mb-4 flex items-center gap-2">
              <span className="bg-blue-100 px-3 py-1 rounded-lg">
                生成提示词（5个）
              </span>
            </h3>

            {/* 提示词1-5的详细说明将在下面添加，由于内容较长，我会分批添加 */}
            <p className="text-gray-600 text-sm mb-4">
              详细内容请查看下方各个提示词的卡片说明...
            </p>
          </div>

          {/* 优化提示词组 */}
          <div className="mt-8">
            <h3 className="text-xl font-bold text-orange-800 mb-4 flex items-center gap-2">
              <span className="bg-orange-100 px-3 py-1 rounded-lg">
                优化提示词（7个）
              </span>
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              详细内容请查看下方各个提示词的卡片说明...
            </p>
          </div>
        </div>

        {/* 提示词详细卡片 */}
        <div className="mt-8 space-y-6">
          {/* ========== 生成提示词 ========== */}

          {/* 1. 脑洞生成提示词 */}
          <section id="author-stage1-idea">
            <PromptCard
              number={1}
              title="脑洞生成提示词（ideaPromptId）"
              type="生成"
              purpose="扩展用户的初始想法，生成完整的故事构思"
              userParams={["初始想法"]}
              systemParams={[]}
              outputFormat="纯文本"
              needJson={false}
              example={`你是一位经验丰富的小说创意顾问。

用户提供了一个初始想法：
{{初始想法}}

请扩展成完整的故事构思，包含：
1. 核心创意
2. 世界观设定
3. 主要冲突
4. 角色雏形
5. 情节走向

要求输出3-5段文字，每段150-300字。`}
            />
          </section>

          {/* 2. 书名简介生成提示词 */}
          <section id="author-stage2">
            <PromptCard
              number={2}
              title="书名简介生成提示词（titlePromptId）"
              type="生成"
              purpose="根据脑洞内容生成书名和简介"
              userParams={[]}
              systemParams={["脑洞内容"]}
              outputFormat="JSON"
              needJson={true}
              jsonStructure={`{
  "titles": ["书名1", "书名2", "书名3", "书名4", "书名5"],
  "synopsis": "简介内容（200-300字）"
}`}
              example={`根据以下脑洞内容，为这部小说生成书名和简介：

{{脑洞内容}}

请以JSON格式输出：
{
  "titles": ["书名1", "书名2", "书名3"],
  "synopsis": "简介内容"
}

注意：只输出JSON，不要包含markdown代码块标记。`}
            />
          </section>

          {/* 3. 主大纲生成提示词 */}
          <section id="author-stage3a">
            <PromptCard
              number={3}
              title="主大纲生成提示词（mainOutlinePromptId）"
              type="生成"
              purpose="生成顶层大纲结构（5-10个主要节点）"
              userParams={[]}
              systemParams={["书名", "简介", "脑洞"]}
              outputFormat="JSON数组"
              needJson={true}
              jsonStructure={`[
  {
    "title": "节点标题",
    "content": "详细描述（100-200字）",
    "percentage": 15
  }
]`}
              example={`为以下小说设计主大纲（顶层结构）：
- 书名：{{书名}}
- 简介：{{简介}}
- 脑洞：{{脑洞}}

请生成5-10个主要节点，严格按照JSON数组格式输出：
[
  {
    "title": "节点标题",
    "content": "详细描述",
    "percentage": 15
  }
]

注意：只输出JSON数组，不要包含markdown标记。`}
            />
          </section>

          {/* 4. 卷大纲生成提示词 */}
          <section id="author-stage3b">
            <PromptCard
              number={4}
              title="卷大纲生成提示词（volumeOutlinePromptId）"
              type="生成"
              purpose="将主大纲节点细化为分卷（每个节点生成3-5个卷）"
              userParams={[]}
              systemParams={["主大纲节点标题", "主大纲节点内容"]}
              outputFormat="JSON数组"
              needJson={true}
              jsonStructure={`[
  {
    "title": "卷标题",
    "description": "卷描述内容"
  }
]`}
              note="💡 执行方式：阶段3a会生成一个包含5-10个节点的JSON数组，系统会读取整个数组，然后逐个循环处理。每次循环只传入一个节点的标题和内容到此提示词，生成该节点的分卷。"
              example={`为主大纲节点生成分卷：

主大纲节点：
- 标题：{{主大纲节点标题}}
- 内容：{{主大纲节点内容}}

请生成3-5个分卷，以JSON数组格式输出：
[
  {
    "title": "卷标题",
    "description": "卷描述"
  }
]

注意：只输出JSON数组，不要包含markdown标记。`}
            />
          </section>

          {/* 5. 章节大纲生成提示词 */}
          <section id="author-stage3c">
            <PromptCard
              number={5}
              title="章节大纲生成提示词（chapterOutlinePromptId）"
              type="生成"
              purpose="为每个卷生成章节大纲（包含标题、梗概、人物卡、世界观、场景、情节点）"
              userParams={[]}
              systemParams={["卷标题", "卷描述"]}
              outputFormat="JSON数组"
              needJson={true}
              jsonStructure={`[
  {
    "title": "章节标题",
    "summary": "章节梗概（50-100字）",
    "characters": [
      {
        "name": "人物名称",
        "category": "分类（如：主要人物、配角、反派）",
        "fields": {
          "性别": "男/女",
          "年龄": "年龄",
          "身份": "身份描述",
          "性格": "性格特点",
          "外貌": "外貌描述",
          "能力": "能力描述",
          "...": "....."
        }
      }
    ],
    "worldviews": [
      {
        "name": "世界观名称",
        "category": "分类（如：世界设定、规则设定、物品、词条）",
        "fields": {
          "世界类型": "现代/古代/未来/异世界",
          "核心规则": "魔法/科技/修炼等",
          "地理环境": "地理描述",
          "社会结构": "社会描述",
          "...": "....."
        }
      }
    ],
    "mainScene": "场景描述",
    "plotPoints": ["情节点1", "情节点2"]
  }
]`}
              note="💡 执行方式：阶段3b会为每个主节点生成多个卷，系统会读取所有卷，然后逐个循环处理。每次循环只传入一个卷的标题和描述到此提示词。⚠️ characters和worldviews字段中的信息会被系统自动提取，创建人物卡和世界观实体。建议在提示词中要求AI为每个角色和世界观提供完整的fields字段信息。"
              example={`为以下卷生成章节大纲：

卷信息：
- 标题：{{卷标题}}
- 描述：{{卷描述}}

请生成章节大纲，以JSON数组格式输出：
[
  {
    "title": "章节标题",
    "summary": "章节梗概（50-100字）",
    "characters": [
      {
        "name": "人物名称",
        "category": "主要人物",
        "fields": {
          "性别": "男",
          "年龄": "18",
          "身份": "身份描述",
          "性格": "性格特点",
          "外貌": "外貌描述",
          "能力": "能力描述",
          "背景": "背景故事"
        }
      }
    ],
    "worldviews": [
      {
        "name": "世界观名称",
        "category": "世界设定",
        "fields": {
          "世界类型": "修仙世界",
          "核心规则": "灵气修炼",
          "地理环境": "地理描述",
          "社会结构": "社会描述",
          "其他设定": "其他重要设定"
        }
      }
    ],
    "mainScene": "场景描述",
    "plotPoints": ["情节点1", "情节点2"]
  }
]

注意：
1. 只输出JSON数组，不要包含markdown标记
2. characters和worldviews字段要提供完整的对象结构，包含name、category和fields
3. fields中的字段可以灵活调整，但建议包含尽可能详细的信息
4. 系统会自动从characters和worldviews字段提取并创建人物卡和世界观实体`}
            />
          </section>

          {/* ========== 优化提示词 ========== */}

          {/* 6. 脑洞优化提示词 */}
          <section id="author-stage1-optimize">
            <PromptCard
              number={6}
              title="脑洞优化提示词（ideaOptimizePromptId）"
              type="优化"
              purpose="根据用户反馈优化已生成的脑洞内容"
              userParams={[]}
              systemParams={["原始脑洞", "用户反馈"]}
              outputFormat="纯文本"
              needJson={false}
              example={`请根据用户反馈优化以下脑洞内容：

原始脑洞：
{{原始脑洞}}

用户反馈：
{{用户反馈}}

请优化脑洞内容，保持原有风格和长度。`}
            />
          </section>

          {/* 7-9. 大纲优化提示词（简化说明） */}
          <section id="author-stage3a-optimize">
            <PromptCard
              number={7}
              title="主大纲优化提示词（mainOutlineOptimizePromptId）"
              type="优化"
              purpose="根据用户反馈优化主大纲结构"
              userParams={[]}
              systemParams={["原始主大纲", "用户反馈"]}
              outputFormat="JSON数组"
              needJson={true}
              jsonStructure={`[
  {
    "title": "节点标题",
    "content": "详细描述（100-200字）",
    "percentage": 15
  }
]`}
              note="格式与主大纲生成提示词相同"
              example={`请根据用户反馈优化以下主大纲：

原始主大纲：
{{原始主大纲}}

用户反馈：
{{用户反馈}}

请优化主大纲，严格按照JSON数组格式输出：
[
  {
    "title": "节点标题",
    "content": "详细描述",
    "percentage": 15
  }
]

注意：只输出JSON数组，不要包含markdown标记。`}
            />
          </section>

          <section id="author-stage3b-optimize">
            <PromptCard
              number={8}
              title="卷大纲优化提示词（volumeOutlineOptimizePromptId）"
              type="优化"
              purpose="根据用户反馈优化卷纲结构"
              userParams={[]}
              systemParams={["原始卷纲", "用户反馈"]}
              outputFormat="JSON数组"
              needJson={true}
              jsonStructure={`[
  {
    "title": "卷标题",
    "description": "卷描述内容"
  }
]`}
              note="格式与卷大纲生成提示词相同"
              example={`请根据用户反馈优化以下卷纲：

原始卷纲：
{{原始卷纲}}

用户反馈：
{{用户反馈}}

请优化卷纲，以JSON数组格式输出：
[
  {
    "title": "卷标题",
    "description": "卷描述"
  }
]

注意：只输出JSON数组，不要包含markdown标记。`}
            />
          </section>

          <section id="author-stage3c-optimize">
            <PromptCard
              number={9}
              title="章节大纲优化提示词（chapterOutlineOptimizePromptId）"
              type="优化"
              purpose="根据用户反馈优化章节大纲"
              userParams={[]}
              systemParams={["原始章节大纲", "用户反馈"]}
              outputFormat="JSON数组"
              needJson={true}
              jsonStructure={`[
  {
    "title": "章节标题",
    "summary": "章节梗概（50-100字）",
    "characters": [
      {
        "name": "人物名称",
        "category": "分类（如：主要人物、配角、反派）",
        "fields": {
          "性别": "男/女",
          "年龄": "年龄",
          "身份": "身份描述",
          "性格": "性格特点",
          "外貌": "外貌描述",
          "能力": "能力描述",
          "...": "....."
        }
      }
    ],
    "worldviews": [
      {
        "name": "世界观名称",
        "category": "分类（如：世界设定、规则设定、物品、词条）",
        "fields": {
          "世界类型": "现代/古代/未来/异世界",
          "核心规则": "魔法/科技/修炼等",
          "地理环境": "地理描述",
          "社会结构": "社会描述",
          "...": "....."
        }
      }
    ],
    "mainScene": "场景描述",
    "plotPoints": ["情节点1", "情节点2"]
  }
]`}
              note="格式与章节大纲生成提示词相同。⚠️ 优化后的characters和worldviews字段也会被系统重新提取。"
              example={`请根据用户反馈优化以下章节大纲：

原始章节大纲：
{{原始章节大纲}}

用户反馈：
{{用户反馈}}

请优化章节大纲，以JSON数组格式输出：
[
  {
    "title": "章节标题",
    "summary": "章节梗概（50-100字）",
    "characters": [
      {
        "name": "人物名称",
        "category": "主要人物",
        "fields": {
          "性别": "男",
          "年龄": "18",
          "身份": "身份描述",
          "性格": "性格特点",
          "外貌": "外貌描述",
          "能力": "能力描述",
          "背景": "背景故事"
        }
      }
    ],
    "worldviews": [
      {
        "name": "世界观名称",
        "category": "世界设定",
        "fields": {
          "世界类型": "修仙世界",
          "核心规则": "灵气修炼",
          "地理环境": "地理描述",
          "社会结构": "社会描述",
          "其他设定": "其他重要设定"
        }
      }
    ],
    "mainScene": "场景描述",
    "plotPoints": ["情节点1", "情节点2"]
  }
]

注意：
1. 只输出JSON数组，不要包含markdown标记
2. characters和worldviews字段要提供完整的对象结构
3. fields中的字段可以灵活调整，但建议包含尽可能详细的信息`}
            />
          </section>

          {/* 10. 章节正文生成提示词 */}
          <section id="author-stage4">
            <PromptCard
              number={10}
              title="章节正文生成提示词（contentPromptId）"
              type="优化"
              purpose="根据章节大纲、人物卡、世界观等信息生成章节正文（2000-3000字）"
              userParams={[]}
              systemParams={[
                "章节标题",
                "章节梗概",
                "前面章节的梗概",
                "人物卡列表",
                "世界观列表",
              ]}
              outputFormat="纯文本"
              needJson={false}
              note="⚠️ 系统会传入该作品所有的人物卡和世界观，但某一章可能只涉及部分角色。建议在提示词中强调：'只使用本章梗概中提到的角色和场景，不要随意添加其他角色'。"
              example={`你是一位专业的小说作家。

章节信息：
- 标题：{{章节标题}}
- 梗概：{{章节梗概}}

前文梗概：
{{前面章节的梗概}}

人物设定：
{{人物卡列表}}

世界观设定：
{{世界观列表}}

请创作本章正文（2000-3000字）。

要求：
1. 只使用本章梗概中提到的角色，不要随意添加其他角色
2. 保持与前文情节的连贯性
3. 直接输出正文内容，不需要标题，不需要JSON格式`}
            />
          </section>

          {/* 11. 审稿提示词 */}
          <section id="author-stage5-review">
            <PromptCard
              number={11}
              title="审稿提示词（reviewPromptId）"
              type="优化"
              purpose="审查章节正文的质量，包括逻辑问题、连贯性、文笔等"
              userParams={[]}
              systemParams={["章节标题", "章节正文"]}
              outputFormat="JSON"
              needJson={true}
              jsonStructure={`{
  "score": 85,
  "issues": [
    {
      "type": "logic",
      "severity": "medium",
      "description": "逻辑问题描述",
      "location": "第X段"
    }
  ],
  "suggestions": ["建议1", "建议2"],
  "strengths": ["优点1", "优点2"]
}`}
              example={`请审查以下章节的质量：

章节标题：{{章节标题}}
章节正文：{{章节正文}}

请从以下方面审查：
1. 逻辑是否合理
2. 与前文是否连贯
3. 文笔是否流畅
4. 人物性格是否一致

请以JSON格式输出审稿报告：
{
  "score": 85,
  "issues": [...],
  "suggestions": [...],
  "strengths": [...]
}

注意：只输出JSON，不要包含markdown标记。`}
            />
          </section>

          {/* 12. 正文优化提示词 */}
          <section id="author-stage5-optimize">
            <PromptCard
              number={12}
              title="正文优化提示词（optimizePromptId）"
              type="优化"
              purpose="根据审稿报告和前面章节的内容，优化章节正文"
              userParams={[]}
              systemParams={[
                "章节标题",
                "章节正文",
                "审稿报告JSON",
                "前面章节的梗概",
              ]}
              outputFormat="纯文本"
              needJson={false}
              example={`请根据审稿报告优化以下章节：

章节标题：{{章节标题}}
原章节正文：{{章节正文}}

审稿报告：
{{审稿报告JSON}}

前文梗概：
{{前面章节的梗概}}

请优化章节正文，解决审稿报告中提出的问题，保持与前文的连贯性。

要求：
1. 直接输出优化后的正文内容
2. 不需要标题，不需要JSON格式
3. 保持原有风格和长度`}
            />
          </section>
        </div>
      </section>

      {/* 格式要求总结 */}
      <section id="author-format-summary">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <FileText className="w-6 h-6 text-purple-600" />
          格式要求总结
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-4 py-2 text-left">
                  阶段
                </th>
                <th className="border border-gray-200 px-4 py-2 text-left">
                  期望格式
                </th>
                <th className="border border-gray-200 px-4 py-2 text-left">
                  提示词要求
                </th>
                <th className="border border-gray-200 px-4 py-2 text-left">
                  注意事项
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-200 px-4 py-2">
                  阶段1：脑洞生成
                </td>
                <td className="border border-gray-200 px-4 py-2">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                    纯文本
                  </span>
                </td>
                <td className="border border-gray-200 px-4 py-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm">不需要JSON</span>
                  </div>
                </td>
                <td className="border border-gray-200 px-4 py-2 text-sm text-gray-600">
                  直接输出脑洞内容即可
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-200 px-4 py-2">
                  阶段2：书名简介
                </td>
                <td className="border border-gray-200 px-4 py-2">
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-medium">
                    JSON
                  </span>
                </td>
                <td className="border border-gray-200 px-4 py-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="text-sm">必须要求JSON</span>
                  </div>
                </td>
                <td className="border border-gray-200 px-4 py-2 text-sm text-gray-600">
                  {'结构：{ titles: [...], synopsis: "..." }'}
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-200 px-4 py-2">
                  阶段3a/b/c：大纲
                </td>
                <td className="border border-gray-200 px-4 py-2">
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-medium">
                    JSON数组
                  </span>
                </td>
                <td className="border border-gray-200 px-4 py-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="text-sm">必须要求JSON数组</span>
                  </div>
                </td>
                <td className="border border-gray-200 px-4 py-2 text-sm text-gray-600">
                  每个元素是对象，包含title等字段
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-200 px-4 py-2">
                  阶段4：章节正文
                </td>
                <td className="border border-gray-200 px-4 py-2">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                    纯文本
                  </span>
                </td>
                <td className="border border-gray-200 px-4 py-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm">不需要JSON</span>
                  </div>
                </td>
                <td className="border border-gray-200 px-4 py-2 text-sm text-gray-600">
                  直接输出正文内容
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-200 px-4 py-2">
                  阶段5：审稿报告
                </td>
                <td className="border border-gray-200 px-4 py-2">
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-medium">
                    JSON
                  </span>
                </td>
                <td className="border border-gray-200 px-4 py-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="text-sm">必须要求JSON</span>
                  </div>
                </td>
                <td className="border border-gray-200 px-4 py-2 text-sm text-gray-600">
                  {"结构：{ score, issues, suggestions, strengths }"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 参数映射表 */}
      <section id="author-param-mapping">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Code className="w-6 h-6 text-purple-600" />
          参数映射表 - 系统自动参数从哪里来？
        </h2>

        <div className="space-y-4">
          <p className="text-gray-700">
            提示词作者经常疑惑：我在提示词中使用了{" "}
            <code className="bg-gray-200 px-1 rounded">{"{{脑洞内容}}"}</code>、
            <code className="bg-gray-200 px-1 rounded">{"{{人物卡列表}}"}</code>{" "}
            这些参数，系统是怎么知道从哪里获取数据的？
          </p>

          <InfoBox type="info">
            <p className="font-medium mb-2">答案很简单：</p>
            <p>
              系统已经预先设置好了每个阶段需要哪些信息。当执行某个阶段时，系统会自动：
            </p>
            <ol className="list-decimal list-inside ml-4 mt-2 space-y-1">
              <li>读取前面阶段生成的内容（如脑洞、书名、梗概等）</li>
              <li>查询该作品的相关设定（人物卡、世界观等）</li>
              <li>格式化成文本</li>
              <li>替换到提示词中对应的参数位置</li>
            </ol>
          </InfoBox>

          <InfoBox type="warning" className="mt-4">
            <p className="font-medium mb-2">重要：大纲阶段的循环执行机制</p>
            <p className="text-sm mb-2">
              很多提示词作者疑惑：阶段3a生成的主大纲包含5-10个节点，阶段3b执行时，是读取整个主大纲JSON数组，还是逐个传入？
            </p>
            <p className="text-sm font-medium text-orange-700">
              答案：逐个循环传入！
            </p>
            <ul className="list-disc list-inside ml-4 mt-2 text-sm space-y-1">
              <li>
                <strong>阶段3b（卷大纲生成）：</strong>
                系统会读取整个主大纲数组，然后循环处理。每次循环只传入一个主节点的标题和内容。
              </li>
              <li>
                <strong>阶段3c（章节大纲生成）：</strong>
                系统会读取所有卷，然后循环处理。每次循环只传入一个卷的标题和描述。
              </li>
            </ul>
            <p className="text-sm mt-2 text-gray-700">
              这样设计的好处：每次传给AI的信息量适中，避免上下文过长导致生成质量下降。
            </p>
          </InfoBox>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mt-4">
            <p className="font-medium text-gray-800 mb-3">举例说明：</p>
            <div className="space-y-3 text-sm">
              <div className="bg-white rounded p-3">
                <p className="font-medium text-blue-700 mb-2">
                  阶段3b：卷大纲生成（循环执行）
                </p>
                <p className="text-gray-700 mb-2">
                  假设阶段3a生成了8个主节点，系统会执行以下操作：
                </p>
                <ol className="list-decimal list-inside ml-4 space-y-1 text-gray-600">
                  <li>读取主大纲JSON数组（包含8个节点）</li>
                  <li>
                    第1次循环：取第1个节点的title和content，传入提示词，生成3-5个卷
                  </li>
                  <li>
                    第2次循环：取第2个节点的title和content，传入提示词，生成3-5个卷
                  </li>
                  <li>...</li>
                  <li>
                    第8次循环：取第8个节点的title和content，传入提示词，生成3-5个卷
                  </li>
                  <li>共执行8次，每次只传入一个节点的信息</li>
                </ol>
              </div>

              <div className="bg-white rounded p-3">
                <p className="font-medium text-blue-700 mb-2">
                  阶段4：生成章节正文（批量循环执行）
                </p>
                <p className="text-gray-700 mb-2">系统会自动做这些事：</p>
                <ol className="list-decimal list-inside ml-4 space-y-1 text-gray-600">
                  <li>找到当前要生成的章节（如"第5章"）</li>
                  <li>读取这一章的标题和梗概（阶段3生成的）</li>
                  <li>读取前面几章的梗概（阶段3生成的）</li>
                  <li>读取该作品的所有人物卡（阶段3提取的 + 用户创建的）</li>
                  <li>读取该作品的所有世界观（阶段3提取的 + 用户创建的）</li>
                  <li>把这些信息格式化成文本</li>
                  <li>替换到您提示词中的参数位置</li>
                </ol>
              </div>

              <div className="bg-white rounded p-3">
                <p className="font-medium text-purple-700 mb-2">格式化示例：</p>
                <pre className="bg-gray-50 rounded p-2 text-xs overflow-x-auto whitespace-pre">
                  {`人物卡列表会被格式化成：

【林渊】
- 性别：男
- 年龄：18
- 身份：穿越者
- 性格：冷静、谨慎

【云长老】
- 性别：男
- 年龄：80
- 身份：修仙宗门长老

世界观列表会被格式化成：

【修仙世界】
分类：世界设定
- 世界类型：修仙世界
- 修炼体系：灵根修炼
- 等级划分：练气、筑基、金丹...

【灵石】
分类：物品设定
- 类型：修炼货币
- 作用：可用于修炼和交易`}
                </pre>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <p className="font-medium text-gray-800 mb-3">
              各阶段可用的系统参数：
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="border border-blue-200 px-4 py-2 text-left text-blue-900">
                      阶段
                    </th>
                    <th className="border border-blue-200 px-4 py-2 text-left text-blue-900">
                      系统会自动传入哪些参数
                    </th>
                    <th className="border border-blue-200 px-4 py-2 text-left text-blue-900">
                      这些内容从哪里来
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-blue-50">
                    <td className="border border-blue-200 px-4 py-2 font-medium">
                      阶段1
                    </td>
                    <td className="border border-blue-200 px-4 py-2 text-sm">
                      -
                    </td>
                    <td className="border border-blue-200 px-4 py-2 text-sm text-gray-600">
                      无（第一个阶段）
                    </td>
                  </tr>
                  <tr className="hover:bg-blue-50">
                    <td className="border border-blue-200 px-4 py-2 font-medium">
                      阶段2
                    </td>
                    <td className="border border-blue-200 px-4 py-2 text-sm">
                      <code className="bg-yellow-100 px-1 rounded">
                        脑洞内容
                      </code>
                    </td>
                    <td className="border border-blue-200 px-4 py-2 text-sm text-gray-600">
                      阶段1生成的脑洞
                    </td>
                  </tr>
                  <tr className="hover:bg-blue-50">
                    <td className="border border-blue-200 px-4 py-2 font-medium">
                      阶段3a
                    </td>
                    <td className="border border-blue-200 px-4 py-2 text-sm">
                      <code className="bg-yellow-100 px-1 rounded">书名</code>,{" "}
                      <code className="bg-yellow-100 px-1 rounded">简介</code>,{" "}
                      <code className="bg-yellow-100 px-1 rounded">脑洞</code>
                    </td>
                    <td className="border border-blue-200 px-4 py-2 text-sm text-gray-600">
                      阶段2生成的书名和简介、阶段1的脑洞
                    </td>
                  </tr>
                  <tr className="hover:bg-blue-50">
                    <td className="border border-blue-200 px-4 py-2 font-medium">
                      阶段3b
                    </td>
                    <td className="border border-blue-200 px-4 py-2 text-sm">
                      <code className="bg-yellow-100 px-1 rounded">
                        主大纲节点标题
                      </code>
                      ,{" "}
                      <code className="bg-yellow-100 px-1 rounded">
                        主大纲节点内容
                      </code>
                    </td>
                    <td className="border border-blue-200 px-4 py-2 text-sm text-gray-600">
                      阶段3a生成的主大纲节点（逐个循环）
                    </td>
                  </tr>
                  <tr className="hover:bg-blue-50">
                    <td className="border border-blue-200 px-4 py-2 font-medium">
                      阶段3c
                    </td>
                    <td className="border border-blue-200 px-4 py-2 text-sm">
                      <code className="bg-yellow-100 px-1 rounded">卷标题</code>
                      ,{" "}
                      <code className="bg-yellow-100 px-1 rounded">卷描述</code>
                    </td>
                    <td className="border border-blue-200 px-4 py-2 text-sm text-gray-600">
                      阶段3b生成的卷纲（逐个循环）
                    </td>
                  </tr>
                  <tr className="hover:bg-blue-50">
                    <td className="border border-blue-200 px-4 py-2 font-medium">
                      阶段4
                    </td>
                    <td className="border border-blue-200 px-4 py-2 text-sm">
                      <div className="space-y-1">
                        <div>
                          <code className="bg-yellow-100 px-1 rounded">
                            章节标题
                          </code>
                          ,{" "}
                          <code className="bg-yellow-100 px-1 rounded">
                            章节梗概
                          </code>
                        </div>
                        <div>
                          <code className="bg-yellow-100 px-1 rounded">
                            前面章节的梗概
                          </code>
                        </div>
                        <div>
                          <code className="bg-yellow-100 px-1 rounded">
                            人物卡列表
                          </code>
                          ,{" "}
                          <code className="bg-yellow-100 px-1 rounded">
                            世界观列表
                          </code>
                        </div>
                      </div>
                    </td>
                    <td className="border border-blue-200 px-4 py-2 text-sm text-gray-600">
                      <div className="space-y-1">
                        <div>阶段3生成的章节标题和梗概</div>
                        <div>前N章的梗概汇总</div>
                        <div>该作品的所有人物卡和世界观</div>
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-blue-50">
                    <td className="border border-blue-200 px-4 py-2 font-medium">
                      阶段5
                    </td>
                    <td className="border border-blue-200 px-4 py-2 text-sm">
                      <code className="bg-yellow-100 px-1 rounded">
                        章节标题
                      </code>
                      ,{" "}
                      <code className="bg-yellow-100 px-1 rounded">
                        章节正文
                      </code>
                    </td>
                    <td className="border border-blue-200 px-4 py-2 text-sm text-gray-600">
                      阶段4生成的章节正文
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <InfoBox type="warning" className="mt-4">
            <p className="font-medium mb-2">提示词作者注意：</p>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>
                <strong>参数名必须完全匹配：</strong>
                提示词中使用的参数名（如{" "}
                <code className="bg-gray-200 px-1 rounded">
                  {"{{脑洞内容}}"}
                </code>
                ）必须与系统预定义的参数名完全一致。
              </li>
              <li>
                <strong>查看上面的表格：</strong>
                了解每个阶段可以使用哪些系统自动参数。
              </li>
              <li>
                <strong>用户参数可以自由命名：</strong>
                用户自定义的参数（如"故事类型"、"写作风格"）可以自由命名，但要在提示词的参数定义中声明。
              </li>
              <li>
                <strong>不要混淆两种参数：</strong>
                <ul className="list-disc list-inside ml-6 mt-1">
                  <li>
                    系统参数（如"脑洞内容"）- 系统自动传入，不需要用户填写
                  </li>
                  <li>用户参数（如"故事类型"）- 需要用户在创建任务时填写</li>
                </ul>
              </li>
            </ol>
          </InfoBox>
        </div>
      </section>

      {/* 常见错误 */}
      <section id="author-errors">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-purple-600" />
          常见错误和解决方案
        </h2>

        <div className="space-y-4">
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
            <h4 className="font-medium text-red-600 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              错误1：JSON解析失败
            </h4>
            <div className="space-y-3 text-sm">
              <div>
                <strong className="text-gray-700">原因：</strong>
                <p className="text-gray-600 mt-1">
                  AI返回的内容包含了markdown标记或解释文字
                </p>
              </div>
              <div>
                <strong className="text-gray-700">解决方案：</strong>
                <p className="text-gray-600 mt-1">在提示词末尾强调：</p>
                <pre className="bg-green-50 border border-green-200 rounded p-2 mt-1 text-xs">
                  {`注意：
1. 只输出JSON，不要包含markdown代码块标记（\`\`\`json）
2. 不要添加任何解释性文字
3. 确保JSON格式正确`}
                </pre>
              </div>
            </div>
          </div>

          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
            <h4 className="font-medium text-red-600 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              错误2：章节正文格式错误
            </h4>
            <div className="space-y-3 text-sm">
              <div>
                <strong className="text-gray-700">原因：</strong>
                <p className="text-gray-600 mt-1">
                  提示词要求了JSON格式，但系统期望纯文本
                </p>
              </div>
              <div>
                <strong className="text-gray-700">解决方案：</strong>
                <p className="text-gray-600 mt-1">
                  章节正文直接输出文本即可，不要要求JSON格式：
                </p>
                <pre className="bg-green-50 border border-green-200 rounded p-2 mt-1 text-xs">
                  请直接输出章节正文，不需要标题，不需要JSON格式。
                </pre>
              </div>
            </div>
          </div>

          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
            <h4 className="font-medium text-red-600 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              错误3：参数未替换
            </h4>
            <div className="space-y-3 text-sm">
              <div>
                <strong className="text-gray-700">原因：</strong>
                <p className="text-gray-600 mt-1">参数名拼写错误或参数未定义</p>
              </div>
              <div>
                <strong className="text-gray-700">解决方案：</strong>
                <ol className="list-decimal list-inside ml-4 mt-1 text-gray-600 space-y-1">
                  <li>检查参数名拼写，确保与系统预定义的参数名一致</li>
                  <li>参考上面的"参数映射表"</li>
                  <li>如果是用户自定义参数，确保在parameters字段中定义</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 最佳实践 */}
      <section id="author-best-practices">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-600" />
          最佳实践
        </h2>

        <div className="space-y-3">
          <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-gray-800 mb-1">
                  1. 明确指定输出格式
                </h4>
                <div className="text-sm text-gray-600">
                  在提示词末尾清楚说明期望的输出格式（JSON或纯文本），并提供格式示例。
                </div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-gray-800 mb-1">
                  2. 使用标准参数名
                </h4>
                <div className="text-sm text-gray-600">
                  系统自动参数使用标准参数名（参考映射表），用户自定义参数可以自由命名但要清晰易懂。
                </div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-gray-800 mb-1">
                  3. 提供完整的fields结构
                </h4>
                <div className="text-sm text-gray-600">
                  在章节大纲生成提示词中，如果要自动提取人物卡和世界观，应该提供完整的fields字段示例，包含性别、年龄、身份等详细信息。
                </div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-gray-800 mb-1">
                  4. 强调JSON格式要求
                </h4>
                <div className="text-sm text-gray-600">
                  <p className="mb-2">
                    对于需要JSON的阶段，在提示词末尾添加3条注意事项：
                  </p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>只输出JSON，不要包含markdown标记</li>
                    <li>不要添加任何解释性文字</li>
                    <li>确保JSON格式正确</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-gray-800 mb-1">
                  5. 测试提示词
                </h4>
                <div className="text-sm text-gray-600">
                  在创建提示词组前，先在AI助手中测试单个提示词，确保输出格式正确。
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// ========== 辅助组件（保持与之前相同）==========

interface StepItemProps {
  number: number;
  title: string;
  children: React.ReactNode;
  completed?: boolean;
}

const StepItem: React.FC<StepItemProps> = ({
  number,
  title,
  children,
  completed,
}) => {
  return (
    <div className="flex items-start gap-4">
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
          completed ? "bg-green-500" : "bg-blue-500"
        }`}
      >
        {completed ? <CheckCircle className="w-5 h-5" /> : number}
      </div>
      <div className="flex-1">
        <h4 className="font-medium text-gray-800 mb-1">{title}</h4>
        <div className="text-gray-600 text-sm">{children}</div>
      </div>
    </div>
  );
};

interface FAQItemProps {
  question: string;
  children: React.ReactNode;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium text-gray-800 text-left">{question}</span>
        {isOpen ? (
          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-4 text-gray-600 text-sm border-t border-gray-100">
          <div className="mt-3">{children}</div>
        </div>
      )}
    </div>
  );
};

interface InfoBoxProps {
  type: "info" | "warning" | "error" | "success";
  children: React.ReactNode;
  className?: string;
}

const InfoBox: React.FC<InfoBoxProps> = ({
  type,
  children,
  className = "",
}) => {
  const styles: Record<
    string,
    { bg: string; border: string; text: string; icon: React.ReactNode }
  > = {
    info: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-800",
      icon: <HelpCircle className="w-5 h-5" />,
    },
    warning: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      text: "text-yellow-800",
      icon: <AlertTriangle className="w-5 h-5" />,
    },
    error: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-800",
      icon: <AlertTriangle className="w-5 h-5" />,
    },
    success: {
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-800",
      icon: <CheckCircle className="w-5 h-5" />,
    },
  };

  const { bg, border, text, icon } = styles[type];

  return (
    <div className={`${bg} border ${border} rounded-lg p-4 ${className}`}>
      <div className={`flex items-start gap-3 ${text}`}>
        <div className="flex-shrink-0 mt-0.5">{icon}</div>
        <div className="flex-1 text-sm">{children}</div>
      </div>
    </div>
  );
};

interface TipBoxProps {
  type: "success" | "warning";
  children: React.ReactNode;
}

const TipBox: React.FC<TipBoxProps> = ({ type, children }) => {
  const isWarning = type === "warning";

  return (
    <div
      className={`${
        isWarning
          ? "bg-yellow-50 border-yellow-200"
          : "bg-green-50 border-green-200"
      } border-l-4 rounded-lg p-4`}
    >
      <div className="flex items-start gap-3">
        <Lightbulb
          className={`w-5 h-5 flex-shrink-0 ${
            isWarning ? "text-yellow-600" : "text-green-600"
          }`}
        />
        <div className="flex-1 text-sm text-gray-700">{children}</div>
      </div>
    </div>
  );
};

interface ConceptBoxProps {
  title: string;
  children: React.ReactNode;
}

const ConceptBox: React.FC<ConceptBoxProps> = ({ title, children }) => {
  return (
    <div className="bg-gray-50 border-l-4 border-blue-500 rounded-lg p-4">
      <h4 className="font-medium text-gray-800 mb-2">{title}</h4>
      <div className="text-sm text-gray-600">{children}</div>
    </div>
  );
};

// ========== PromptCard 组件 ==========

interface PromptCardProps {
  number: number;
  title: string;
  type: "生成" | "优化";
  purpose: string;
  userParams: string[];
  systemParams: string[];
  outputFormat: string;
  needJson: boolean;
  jsonStructure?: string;
  note?: string;
  example?: string;
}

const PromptCard: React.FC<PromptCardProps> = ({
  number,
  title,
  type,
  purpose,
  userParams,
  systemParams,
  outputFormat,
  needJson,
  jsonStructure,
  note,
  example,
}) => {
  const isGenerate = type === "生成";
  const borderColor = isGenerate ? "border-blue-500" : "border-orange-500";
  const bgColor = isGenerate ? "bg-blue-500" : "bg-orange-500";

  return (
    <div
      className={`bg-white border-l-4 ${borderColor} rounded-lg p-5 shadow-sm`}
    >
      <h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
        <span className={`${bgColor} text-white px-2 py-1 rounded text-sm`}>
          {number}
        </span>
        {title}
      </h4>

      <div className="space-y-3 text-sm">
        <div>
          <strong className="text-gray-700">用途：</strong>
          <p className="text-gray-600 mt-1">{purpose}</p>
        </div>

        {userParams.length > 0 && (
          <div>
            <strong className="text-gray-700">用户需要填写的参数：</strong>
            <div className="flex flex-wrap gap-2 mt-1">
              {userParams.map((param, idx) => (
                <code
                  key={idx}
                  className="bg-yellow-100 px-2 py-0.5 rounded text-xs"
                >
                  {param}
                </code>
              ))}
            </div>
          </div>
        )}

        {systemParams.length > 0 && (
          <div>
            <strong className="text-gray-700">系统自动传入的参数：</strong>
            <div className="flex flex-wrap gap-2 mt-1">
              {systemParams.map((param, idx) => (
                <code
                  key={idx}
                  className="bg-green-100 px-2 py-0.5 rounded text-xs"
                >
                  {param}
                </code>
              ))}
            </div>
            <p className="text-gray-600 mt-1 text-xs">
              （系统会自动传入，无需用户填写）
            </p>
          </div>
        )}

        <div>
          <strong className="text-gray-700">输出格式：</strong>
          <span
            className={`${
              needJson
                ? "bg-red-100 text-red-800"
                : "bg-green-100 text-green-800"
            } px-2 py-1 rounded text-xs ml-2 font-medium`}
          >
            {outputFormat}
          </span>
          {needJson && (
            <p className="text-gray-600 mt-1 text-xs">
              （系统会使用JSON.parse()解析）
            </p>
          )}
        </div>

        {needJson && jsonStructure && (
          <div className="bg-gray-50 rounded p-3">
            <strong className="text-gray-700 block mb-2">JSON结构要求：</strong>
            <pre className="text-xs overflow-x-auto whitespace-pre-wrap bg-white p-2 rounded border">
              {jsonStructure}
            </pre>
          </div>
        )}

        {note && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
            <p className="text-xs text-yellow-700 whitespace-pre-wrap">
              {note}
            </p>
          </div>
        )}

        {example && (
          <div className="bg-gray-50 rounded p-3">
            <strong className="text-gray-700 block mb-2">
              提示词模板示例：
            </strong>
            <pre className="text-xs overflow-x-auto whitespace-pre-wrap bg-white p-2 rounded border">
              {example}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookCreationHelpPage;
