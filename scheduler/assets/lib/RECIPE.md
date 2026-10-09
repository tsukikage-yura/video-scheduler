# 材质绘制配方（e061-e075 共用）

## 已建好的公共库
- 公共代码：\`build/kit.txt\`（函数：hashi/vnoise/fbm/ridged/voronoi/rng/ramp/rgba/hex/field/grain/vignette/warmLight/roundedPolyPath/blobPath/fuzz）
- 构建脚本：\`node build/build.mjs <编号>\` —— 读 \`build/exps/<编号>.txt\`，拼上 kit，生成 \`code/<编号>.html\`
- 截图：\`node shoot.mjs code/<编号>.html out/<编号>.png\`
- **只改 \`build/exps/<编号>.txt\`**，不要直接改 \`code/<编号>.html\`（会被覆盖）
- exps txt 格式：第一行 \`//@title 标题\`，然后 \`function draw(g,W,H){ ... }\`

## 关键函数速查
- \`field(w,h,fn)\` → 返回离屏 canvas。fn(x,y) 返回 [r,g,b] 或 [r,g,b,a]。**这是做材质的主力**：逐像素写颜色。
- \`fbm(x,y,oct,seed)\` 分形噪声（0..1）；\`ridged\` 山脊噪声；\`voronoi(x,y,seed,jit)\` → {f1,f2,id,edge,cx,cy}；\`hashi(x,y,s)\` 白噪声 0..1；\`rng(seed)\` 序列随机
- \`ramp(stops,t)\` 色带取色：stops=[[0,[r,g,b]],[1,[r,g,b]]]
- \`grain(g,W,H,amt,seed,chroma)\` 全屏颗粒（overlay 混合）
- \`vignette(g,W,H,strength)\` 暗角
- \`warmLight(g,W,H,cx,cy,rad,'255,190,120',alpha)\` 屏幕混合暖光
- \`roundedPolyPath(pts,r)\` / \`blobPath(cx,cy,rx,ry,n,seed,jit)\` 返回 Path2D
- \`fuzz(ctx,pts,count,seed,len,col,width)\` 沿折线法线抖毛边

## 已验证好用的材质配方（照抄骨架，换参数即可）
1. **底子用 field 逐像素**写纹理（噪声/等值线/元胞），分辨率取 1/2 ~ 1/1，再 \`drawImage\` 放大到画布。
2. **叠光**：先画材质 → 再叠 \`createLinearGradient\` 的定向光（左上来光/右下背光）→ 叠 AO 底部沉暗 → \`vignette\` → \`grain\`。
3. **细节三件套**：大尺度斑驳（低频 fbm，multiply 混合）+ 中尺度结构（砌块/裂纹/凹坑）+ 高频颗粒（grain）。缺任何一层都会"塑料感"。
4. **描边**：材质内部结构要有明确的深色描边（\`rgba(24,19,14,0.9)\`，2-3px），否则会糊。
5. **倒角**：每个结构单元内部画左上亮线 + 右下暗线，体积感立刻出来。

## 硬性要求
- 1920×1080，纯代码，**禁止 Math.random()**，禁止外部图片
- 画布元素 id 必须是 \`c\`，脚本末尾由 build 自动调用 \`draw(g,W,H)\`
- 每张图左上角写标题 \`材质名 · eNNN\` 和一行英文副标题
- 完成后写 \`notes/eNNN.md\`：手法、关键发现（尤其是"怎么做才精致"）
- 必须截图看结果，至少迭代 2 次
