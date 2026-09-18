import React from 'react';
import {
  Compass,
  ArrowRight,
  TrendingDown,
  Layers,
  Sparkles,
  Maximize2,
  Box,
  Scale,
  Split,
  Binary
} from 'lucide-react';

export const TheoryDeduction: React.FC = () => {
  return (
    <div id="theory-deduction" className="flex flex-col gap-8 max-w-5xl mx-auto">
      {/* Title & Manifest */}
      <div className="bg-[#141619] border border-zinc-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-widest">
            <Compass className="w-4 h-4" />
            <span>TYPOGRAPHIC DEDUCTION & MATHEMATICAL SPECIFICATION</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
            从快递柜动力学到新字体：推导逻辑全解析
          </h2>

          <p className="text-sm text-zinc-300 font-sans leading-relaxed max-w-3xl">
            根据给出的双门快递柜草图与物理规则（上层柜门不动；下层柜门左侧为铰链，从右边弹开并向左旋；从正视角看，下半字高度不变，只横向缩窄并偏向左侧），我们推导出了一套严谨的现代实验字体设计体系——<strong className="text-amber-400">「柜构体」(Locker Sans)</strong>。
          </p>
        </div>
      </div>

      {/* Grid of 4 Core Deduction Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pillar 1: Geometric Math */}
        <div className="bg-[#141619] border border-zinc-800 rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Binary className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-mono text-sm font-bold text-white uppercase">
                1. 几何投影公式推导
              </h3>
              <span className="text-[11px] font-mono text-zinc-500">Orthographic Cosine Contraction</span>
            </div>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed">
            设柜体宽高为 <span className="font-mono text-amber-300">W × H</span>，分界线处于中线 <span className="font-mono text-amber-300">Y = 0.5H</span>。
            当门板绕左侧垂直铰链轴（<span className="font-mono text-amber-300">X = 0</span>）旋转角度为 <span className="font-mono text-amber-300">θ</span> 时，空间中的点 <span className="font-mono">(x, y, 0)</span> 转换为：
          </p>

          <div className="bg-black/60 p-4 rounded-xl border border-zinc-800 font-mono text-xs text-zinc-300 space-y-1.5">
            <div className="text-emerald-400 font-bold">// 上半部 (Y &lt; 0.5H，固定不动):</div>
            <div className="pl-4">P'_upper(x, y) = [ x, y ]</div>

            <div className="text-amber-400 font-bold pt-2">// 下半部 (Y &ge; 0.5H，左铰链旋转):</div>
            <div className="pl-4">P'_lower(x, y) = [ x · cos(θ), y ]</div>

            <div className="text-[11px] text-zinc-500 pt-2 border-t border-zinc-800">
              投影缩窄因子: k = cos(θ) ∈ (0, 1]；<br />
              当 θ=0° 时 k=1 (原始黑体)；当 θ=60° 时 k=0.5 (横缩50%)。
            </div>
          </div>
        </div>

        {/* Pillar 2: Dynamic Center of Gravity */}
        <div className="bg-[#141619] border border-zinc-800 rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-400/10 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-mono text-sm font-bold text-white uppercase">
                2. 重心左偏与力矩失衡
              </h3>
              <span className="text-[11px] font-mono text-zinc-500">Center of Gravity & Kinetic Torque</span>
            </div>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed">
            绝大多数西方大写黑体（如 A, H, M, O, T, X）具备严密的竖向对称性。本规则通过锁定左铰链，对下半部施加了单侧挤压力：
          </p>

          <ul className="text-xs text-zinc-300 space-y-2 list-disc list-inside">
            <li>
              <strong className="text-white">对称性破缺：</strong>
              右侧边界从 X=W 强行回缩至 X=W·cos(θ)，而左侧边界 X=0 纹丝不动。
            </li>
            <li>
              <strong className="text-white">重心折线偏转：</strong>
              整体字形的视觉重心从原本的垂直中轴，剧烈折向左下方，产生如建筑悬挑或起重机悬臂般的倾覆动势。
            </li>
            <li>
              <strong className="text-white">动态张力平衡：</strong>
              上部门板以庞大稳重的体量锚固，下部门板以收紧收敛的形态支撑，形成前所未有的“上实下收、上稳下倾”美学。
            </li>
          </ul>
        </div>

        {/* Pillar 3: Optical Density Paradox */}
        <div className="bg-[#141619] border border-zinc-800 rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-400/10 border border-rose-400/30 flex items-center justify-center text-rose-400">
              <Split className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-mono text-sm font-bold text-white uppercase">
                3. 笔画密度与中缝错位
              </h3>
              <span className="text-[11px] font-mono text-zinc-500">Curvature Fracture & Ink Density</span>
            </div>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed">
            在传统的字体设计中，为了保证灰度（Typographic Gray）均匀，字面各处笔画疏密保持严谨平衡。然而柜构体引发了颠覆性特征：
          </p>

          <div className="space-y-2 text-xs text-zinc-300">
            <div className="p-2.5 bg-zinc-900 rounded-lg border border-zinc-800">
              <strong className="text-amber-300 block mb-0.5">负形被极端压缩（Counter Squeeze）</strong>
              下半部的内白（如 B、O、P、D 的内部字腔）横向极度缩小，黑度大幅增高，形成强烈的“上透光、下聚墨”对比。
            </div>
            <div className="p-2.5 bg-zinc-900 rounded-lg border border-zinc-800">
              <strong className="text-emerald-300 block mb-0.5">中缝机械断层（Seam Glitch）</strong>
              在 Y=0.5H 缝隙处，笔画不连续性直观暴露了柜门的机械物理构造，如同工业设备的拼缝接合。
            </div>
          </div>
        </div>

        {/* Pillar 4: Variable Font Axis */}
        <div className="bg-[#141619] border border-zinc-800 rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-400/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-mono text-sm font-bold text-white uppercase">
                4. 变量字体新轴度 (Variable Axis)
              </h3>
              <span className="text-[11px] font-mono text-zinc-500">The "LKO" (Locker Open) OpenType Axis</span>
            </div>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed">
            这一逻辑完美契合现代 OpenType Variable Font 标准。我们可以将其定义为一个连续变化的字形轴：
          </p>

          <div className="bg-black/60 p-3.5 rounded-xl border border-zinc-800 font-mono text-xs text-zinc-300 space-y-1">
            <div className="text-zinc-400">@font-face {'{'}</div>
            <div className="pl-4 text-emerald-400">font-family: 'Locker Sans';</div>
            <div className="pl-4 text-amber-300">/* 开合角轴: 0 (完全闭合) ~ 80 (极限压缩) */</div>
            <div className="pl-4 text-sky-400">font-variation-settings: 'LKO' 45;</div>
            <div className="text-zinc-400">{'}'}</div>
          </div>

          <p className="text-[11px] text-zinc-400">
            不仅可用于静态海报排版，更能通过 CSS 动画响应用户的悬浮、滚轮、包裹取出等交互状态，成为真正会“呼吸开合”的数字化公共字体。
          </p>
        </div>
      </div>

      {/* Typographic Classification Taxonomy Matrix */}
      <div className="bg-[#141619] border border-zinc-800 rounded-2xl p-6 flex flex-col gap-4">
        <h3 className="font-mono text-base font-bold text-white uppercase tracking-wider">
          全字母族演进形态分类推演表 (Alphabet Taxonomy)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-zinc-900/80 rounded-xl border border-zinc-850 space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-zinc-800">
              <span className="font-mono font-bold text-amber-400">1. 垂直贯通族 (H, I, T, Y, J)</span>
            </div>
            <p className="text-zinc-300 leading-relaxed">
              原本贯穿上下的垂直干柱在切分缝发生错位平移。如 <strong>T</strong> 字的下中立柱向左错位成偏心垂柱；<strong>H</strong> 字下双腿聚缩成单侧双立轨。
            </p>
          </div>

          <div className="p-4 bg-zinc-900/80 rounded-xl border border-zinc-850 space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-zinc-800">
              <span className="font-mono font-bold text-emerald-400">2. 环状弧线族 (B, C, D, G, O, P, Q, S, U)</span>
            </div>
            <p className="text-zinc-300 leading-relaxed">
              饱满圆弧下段被压缩成窄长扁胶囊。如 <strong>O</strong> 上半部正圆、下半部紧贴左轴的极窄拱门；<strong>B</strong> 上肚大下肚窄形成倒金字塔。
            </p>
          </div>

          <div className="p-4 bg-zinc-900/80 rounded-xl border border-zinc-850 space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-zinc-800">
              <span className="font-mono font-bold text-sky-400">3. 跨步斜角族 (A, K, M, N, R, V, W, X, Z)</span>
            </div>
            <p className="text-zinc-300 leading-relaxed">
              右侧向外跨步的斜支撑腿被机械门强制向左折拢。如 <strong>A</strong> 右腿极度收缩变成直角梯形；<strong>X</strong> 下半剪刀腿错位变形。
            </p>
          </div>
        </div>
      </div>

      {/* De-Mediumization & Pure Glyph Genesis (User's Core Philosophy) */}
      <div className="bg-gradient-to-r from-amber-500/10 via-[#141619] to-[#141619] border border-amber-400/40 rounded-2xl p-6 sm:p-8 flex flex-col gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400 text-black flex items-center justify-center font-black">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">
                DE-MEDIUMIZATION PHILOSOPHY
              </span>
              <span className="text-[10px] font-mono bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded">
                脱媒新字论
              </span>
            </div>
            <h3 className="font-mono text-lg font-black text-white">
              脱媒新生：从机械载体到纯粹字体形态
            </h3>
          </div>
        </div>

        <div className="space-y-3 text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed">
          <p>
            快递柜在本次设计推导中是一个赋予文字动力的<strong>「变形媒介」</strong>。正如本次设计核心理念所构想：
            <em className="text-amber-300 not-italic font-mono bg-black/40 px-1.5 py-0.5 rounded border border-zinc-800 block my-2">
              “相当于我拿东西变形，把变形完后的媒介去掉，然后直接让变形完后的东西产出来成为新东西。”
            </em>
          </p>
          <p>
            当我们把快递柜外壳、缝隙、门缝、铰链与全部环境元素彻底剥离（开启「脱媒新字形」模式）时，
            <strong>未被变形的上半截母体</strong>与<strong>受旋转投影横缩偏左的下半截</strong>在几何中线处直接连结熔合。
            由此产生的不再是一张“柜门照片”，而是一套具备机械力量感、重心左偏、上下非对称张力的先锋实验字体，
            完成了从具象公共设施向纯粹抽象字形的终极蜕变！
          </p>
        </div>
      </div>
    </div>
  );
};
