/*
  设计路线：暗调私厨 × 宠物健康 DTC。
  数据层目标：把可上线 MVP 的商品、套餐、FAQ、评价与测评选项集中管理，便于后续接 CMS 或表格。
*/
import catSniffing from "@/assets/cats/cat-sniffing.webp";
import catGrooming from "@/assets/cats/cat-grooming.webp";
import catNapping from "@/assets/cats/cat-napping.webp";
import catWindow from "@/assets/cats/cat-window.webp";
import catLounging from "@/assets/cats/cat-lounging.webp";

export const brand = {
  name: "基米厨房",
  englishName: "KIMI KITCHEN",
  slogan: "给挑食主子，做一份会被认真闻过的鲜食。",
  contactEmail: "hello@kimi.example",
  serviceArea: "全国主要城市冷链试运营",
};

export const navItems = [
  { href: "/recommend", label: "测评" },
  { href: "/shop", label: "用品" },
];

export const proofItems = [
  "兽医营养顾问共创食谱",
  "0 谷物 · 0 胶质 · 0 诱食剂",
  "猫咪不爱吃，全额包退",
  "冷链鲜配，周期可暂停",
];

export const stats = [
  { value: "90%", label: "试吃反馈毛发更顺亮", note: "MVP 阶段可替换为真实复购调研" },
  { value: "85%", label: "反馈猫砂盆气味更轻", note: "基于换粮适应期后观察" },
  { value: "3步", label: "从猫咪档案到专属试吃装", note: "先收集线索，再承接客服转化" },
];

export const comparisons = [
  { bad: "高温膨化，肉源不透明", good: "原切肉低温温煮，批次可追溯" },
  { bad: "大量填充碳水，猫咪容易胖", good: "高动物蛋白，按体重控制热量" },
  { bad: "诱食剂香，吃完却不安心", good: "0 诱食剂，用真实肉香打开食欲" },
];

export type ProductCategory = "food" | "snack" | "litter" | "care" | "toy" | "grooming";

export const products = [
  { id: "fresh-chicken-starter", category: "food", img: catSniffing, tag: "鲜食主餐", title: "原切鸡肉温煮餐", desc: "高蛋白、低碳水，给挑食猫也愿意闻一闻的第一口。", price: "¥39 起", priceValue: 39, emoji: "🍲", tone: 0, bullets: ["单猫 3 日试吃", "适合挑食与换粮", "冷冻锁鲜配送"] },
  { id: "duck-warm-meal", category: "food", img: catWindow, tag: "鲜食主餐", title: "鸭肉温补餐", desc: "温和低脂的单一肉质蛋白，给肠胃敏感或熟龄猫更稳的选择。", price: "¥45 起", priceValue: 45, emoji: "🦆", tone: 1, bullets: ["低脂温和好消化", "适合肠胃敏感/熟龄猫", "冷链锁鲜配送"] },
  { id: "rabbit-lowallergen", category: "food", img: catLounging, tag: "鲜食主餐", title: "兔肉低敏餐", desc: "单一蛋白易吸收，给对鸡肉不太耐受的猫咪另一种温和尝试。", price: "¥49 起", priceValue: 49, emoji: "🐇", tone: 2, bullets: ["单一蛋白更易吸收", "适合敏感/不耐受猫", "批次可追溯"] },
  { id: "beef-liver-stew", category: "food", tag: "鲜食主餐", title: "牛肉鸡肝炖罐", desc: "高蛋白牛肉与鸡肝慢炖，适合成猫加餐与拌粮。", price: "¥19.9", priceValue: 19.9, emoji: "🥩", tone: 3, bullets: ["含水量高", "开罐即食", "适合拌粮"] },
  { id: "salmon-freeze-staple", category: "food", tag: "冻干主食", title: "三文鱼冻干主食", desc: "整块三文鱼冻干，零谷物高蛋白，适口性优先。", price: "¥139", priceValue: 139, emoji: "🐟", tone: 4, bullets: ["整块三文鱼", "零谷物配方", "高蛋白"] },
  { id: "chicken-salmon-mix", category: "food", tag: "鲜食主餐", title: "鸡肉三文鱼双拼餐", desc: "鸡肉打底三文鱼提鲜，两蛋白轮换不容易吃腻。", price: "¥59", priceValue: 59, emoji: "🐠", tone: 5, bullets: ["双蛋白轮换", "低温温煮", "锁鲜配送"] },
  { id: "turkey-light-meal", category: "food", tag: "鲜食主餐", title: "火鸡轻盈餐", desc: "低脂火鸡胸，适合需要控制体重又想吃肉的一类。", price: "¥42", priceValue: 42, emoji: "🦃", tone: 1, bullets: ["低脂高蛋白", "适合控重猫", "冷链配送"] },
  { id: "cod-soft-meal", category: "food", tag: "鲜食主餐", title: "鳕鱼软食餐", desc: "细嫩鳕鱼打成泥，适合幼猫与牙口不好的熟龄猫。", price: "¥55", priceValue: 55, emoji: "🐟", tone: 2, bullets: ["细嫩易食", "Omega-3 丰富", "适合幼猫/熟龄"] },
  { id: "shrimp-veg-soup", category: "food", tag: "汤罐", title: "鲜虾时蔬汤罐", desc: "鲜虾与时蔬炖汤，补充水分，适合不爱喝水的猫。", price: "¥16.9", priceValue: 16.9, emoji: "🍤", tone: 3, bullets: ["高汤补水", "时蔬添加", "拌粮加餐"] },
  { id: "kitten-chicken-yam", category: "food", tag: "幼猫奶糕", title: "幼猫鸡肉山药奶糕", desc: "鸡肉与山药温和配方，1-4 月龄幼猫的入门主食。", price: "¥39.9", priceValue: 39.9, emoji: "🍼", tone: 4, bullets: ["幼猫配方", "山药温和", "少量多餐"] },
  { id: "senior-digestible", category: "food", tag: "熟龄主食", title: "熟龄易消化餐", desc: "精细化切割易咀嚼，给 7 岁+猫咪更稳的每日营养。", price: "¥48", priceValue: 48, emoji: "🍲", tone: 0, bullets: ["熟龄专用", "易咀嚼", "温和低敏"] },
  { id: "indoor-hairball", category: "food", tag: "功能主食", title: "室内排毛餐", desc: "添加膳食纤维，帮助室内猫更顺畅排出毛球。", price: "¥46", priceValue: 46, emoji: "🌿", tone: 1, bullets: ["纤维排毛", "适合室内猫", "低油低盐"] },
  { id: "weight-control", category: "food", tag: "功能主食", title: "控重轻食餐", desc: "蛋白充足热量可控，让胖猫减肥也能吃饱吃好。", price: "¥49", priceValue: 49, emoji: "⚖️", tone: 2, bullets: ["热量可控", "高蛋白", "饱腹感强"] },
  { id: "sensitive-single", category: "food", tag: "功能主食", title: "单一蛋白敏感餐", desc: "只选一种肉源，给易过敏/肠胃敏感猫的兜底选择。", price: "¥52", priceValue: 52, emoji: "🍗", tone: 3, bullets: ["单一肉源", "易敏友好", "批次可追溯"] },
  { id: "beef-organs-blend", category: "food", tag: "鲜食主餐", title: "牛杂营养混合餐", desc: "牛肉、牛肝、牛心的内脏营养组合，补铁更均衡。", price: "¥58", priceValue: 58, emoji: "🥩", tone: 4, bullets: ["内脏营养", "铁锌丰富", "成猫加餐"] },
  { id: "duck-liver-topping", category: "food", tag: "拌饭粒", title: "鸭肝拌饭粒", desc: "低温烘干鸭肝粒，撒在鲜食上提升适口性。", price: "¥28", priceValue: 28, emoji: "🦆", tone: 5, bullets: ["纯鸭肝", "低温烘干", "拌粮增味"] },
  { id: "chicken-neck-broth", category: "food", tag: "骨汤冻", title: "鸡架骨汤冻", desc: "鸡架慢炖成汤冻，补水同时增加鲜味。", price: "¥22", priceValue: 22, emoji: "🍗", tone: 0, bullets: ["慢炖骨汤", "补水增味", "冷冻锁鲜"] },
  { id: "freeze-meat-bites", category: "food", tag: "冻干主食", title: "冻干鲜肉粒主食", desc: "多种肉源冻干混合，方便出差携带的主食替代。", price: "¥129", priceValue: 129, emoji: "🍖", tone: 1, bullets: ["多种肉源", "便携主食", "冻干锁鲜"] },
  { id: "lamb-gentle", category: "food", tag: "鲜食主餐", title: "羊肉温和餐", desc: "温补羊肉单一蛋白，适合体质偏寒或冬季加餐。", price: "¥53", priceValue: 53, emoji: "🐑", tone: 2, bullets: ["温和温补", "单一蛋白", "适合冬季"] },
  { id: "multi-cat-family", category: "food", tag: "多猫月卡", title: "多猫家庭月卡", desc: "为多只猫合并配餐，口味轮换 + 周期配送更省心。", price: "¥199/月", priceValue: 199, emoji: "👨‍👩‍👧‍👦", tone: 3, bullets: ["多猫档案", "口味轮换", "合并配送"] },
  { id: "freeze-dried-gut", category: "snack", img: catGrooming, tag: "功能零食", title: "冻干肠胃小方", desc: "随餐加一点，帮助从传统干粮更温和地过渡。", price: "¥45", priceValue: 45, emoji: "🧊", tone: 0, bullets: ["少量多次过渡", "搭配鲜食使用", "适合肠胃敏感猫"] },
  { id: "chicken-breast-bites", category: "snack", tag: "冻干零食", title: "冻干鸡胸肉粒", desc: "单一鸡胸原料，训练奖励 & 拌粮加餐两用。", price: "¥29.9", priceValue: 29.9, emoji: "🍗", tone: 1, bullets: ["单一鸡胸", "低温冻干", "拌粮奖励"] },
  { id: "catnip-freeze-stick", category: "snack", tag: "猫草零食", title: "猫草薄荷冻干棒", desc: "猫草+薄荷冻干，帮助排毛同时安抚情绪。", price: "¥19.9", priceValue: 19.9, emoji: "🌿", tone: 2, bullets: ["猫草薄荷", "帮助排毛", "安抚情绪"] },
  { id: "chicken-meat-paste", category: "snack", tag: "肉泥零食", title: "鸡肉营养泥", desc: "细腻鸡肉泥，适合幼猫、病后恢复与拌粮。", price: "¥12.9", priceValue: 12.9, emoji: "🥫", tone: 3, bullets: ["细腻易食", "适合幼猫", "病后加餐"] },
  { id: "tuna-flakes", category: "snack", tag: "肉松零食", title: "金枪鱼松", desc: "整块金枪鱼烘制鱼松，撒饭增香不含诱食剂。", price: "¥24.9", priceValue: 24.9, emoji: "🐟", tone: 4, bullets: ["金枪鱼烘制", "无诱食剂", "撒饭增香"] },
  { id: "duck-jerky", category: "snack", tag: "肉干零食", title: "鸭肉干", desc: "低脂鸭胸烘干，耐嚼磨牙，适合爱啃咬的猫。", price: "¥26.9", priceValue: 26.9, emoji: "🦆", tone: 5, bullets: ["低脂鸭胸", "耐嚼磨牙", "无添加"] },
  { id: "salmon-skin-crisp", category: "snack", tag: "脆片零食", title: "三文鱼皮脆", desc: "三文鱼皮低温烘成脆片，补充 Omega-3 一吃上瘾。", price: "¥32.9", priceValue: 32.9, emoji: "🐟", tone: 0, bullets: ["三文鱼皮", "Omega-3", "低温烘脆"] },
  { id: "chicken-liver-cube", category: "snack", tag: "冻干零食", title: "鸡肝冻干小方", desc: "高营养鸡肝冻干，训练奖励反应最快的奖励零食。", price: "¥22.9", priceValue: 22.9, emoji: "🍗", tone: 1, bullets: ["高营养鸡肝", "低温冻干", "奖励训练"] },
  { id: "shrimp-freeze", category: "snack", tag: "冻干零食", title: "冻干鲜虾", desc: "整只鲜虾冻干，高蛋白低脂，适合加餐。", price: "¥35.9", priceValue: 35.9, emoji: "🍤", tone: 2, bullets: ["整只鲜虾", "高蛋白", "低脂加餐"] },
  { id: "milk-broth", category: "snack", tag: "汤包", title: "羊奶肉汤包", desc: "羊奶与鸡肉高汤，幼猫与病后猫补充水分营养。", price: "¥15.9", priceValue: 15.9, emoji: "🥛", tone: 3, bullets: ["羊奶高汤", "幼猫友好", "补水补蛋白"] },
  { id: "catnip-ball", category: "snack", tag: "猫草零食", title: "猫薄荷球", desc: "压缩猫薄荷球，啃咬时释放气味，舒缓压力。", price: "¥16.9", priceValue: 16.9, emoji: "🌿", tone: 4, bullets: ["猫薄荷", "舒缓减压", "磨牙啃咬"] },
  { id: "dental-stick", category: "snack", tag: "洁齿零食", title: "洁齿磨牙棒", desc: "有纹理的磨牙棒，帮助摩擦牙垢。", price: "¥18.9", priceValue: 18.9, emoji: "🦷", tone: 5, bullets: ["摩擦牙垢", "耐啃咬", "口气清新"] },
  { id: "salmon-oil-drizzle", category: "snack", tag: "营养液", title: "三文鱼油拌饭液", desc: "一滴管三文鱼油，拌进鲜食里补 Omega-3。", price: "¥39.9", priceValue: 39.9, emoji: "🐟", tone: 0, bullets: ["Omega-3", "拌饭增味", "美毛护肤"] },
  { id: "probiotics-freeze", category: "snack", tag: "营养零食", title: "益生菌冻干", desc: "益生菌冻干小方，随餐补充帮助稳定肠胃。", price: "¥49.9", priceValue: 49.9, emoji: "🧫", tone: 1, bullets: ["活菌冻干", "帮助换粮", "稳定肠胃"] },
  { id: "calcium-paste", category: "snack", tag: "营养零食", title: "钙磷营养膏", desc: "钙磷比均衡，适合幼猫发育与哺乳母猫。", price: "¥28.9", priceValue: 28.9, emoji: "🧴", tone: 2, bullets: ["钙磷均衡", "幼猫发育", "哺乳补充"] },
  { id: "vitamin-cube", category: "snack", tag: "营养零食", title: "复合维生素小方", desc: "多种维生素冻干小方，日常补充更省心。", price: "¥33.9", priceValue: 33.9, emoji: "💊", tone: 3, bullets: ["多种维生素", "日常补充", "冻干锁鲜"] },
  { id: "pumpkin-fiber", category: "snack", tag: "膳食拌料", title: "南瓜膳食纤维拌料", desc: "南瓜纤维拌料，帮助排便顺畅。", price: "¥14.9", priceValue: 14.9, emoji: "🎃", tone: 4, bullets: ["膳食纤维", "帮助排便", "拌饭加餐"] },
  { id: "egg-yolk-freeze", category: "snack", tag: "冻干零食", title: "蛋黄冻干", desc: "整颗蛋黄冻干，补充卵磷脂帮助亮毛。", price: "¥21.9", priceValue: 21.9, emoji: "🥚", tone: 5, bullets: ["卵磷脂", "亮毛美毛", "冻干锁鲜"] },
  { id: "seaweed-topping", category: "snack", tag: "拌饭", title: "海苔碎拌饭", desc: "天然海苔碎撒饭增香，补充碘与天然鲜味。", price: "¥11.9", priceValue: 11.9, emoji: "🍙", tone: 0, bullets: ["天然海苔", "增香拌饭", "适量补充"] },
  { id: "chicken-silk", category: "snack", tag: "肉丝零食", title: "鸡肉丝", desc: "低温撕丝鸡胸，细软易嚼，奖励不脏手。", price: "¥17.9", priceValue: 17.9, emoji: "🍗", tone: 1, bullets: ["低温撕丝", "细软易嚼", "训练奖励"] },
  { id: "litter-toy-kit", category: "litter", img: catWindow, tag: "新手套餐", title: "猫砂玩具启蒙包", desc: "猫砂、猫砂盆、逗猫棒一次备齐，新手家庭开箱即用。", price: "¥89 起", priceValue: 89, emoji: "🧻", tone: 2, bullets: ["猫砂 + 猫砂盆", "适合新手家庭", "随餐凑单配送"] },
  { id: "tofu-litter-original", category: "litter", tag: "豆腐猫砂", title: "原味豆腐猫砂", desc: "可冲马桶，结团快粉尘低，幼猫友好。", price: "¥25.9", priceValue: 25.9, emoji: "🧻", tone: 2, bullets: ["可冲马桶", "结团快", "低粉尘"] },
  { id: "tofu-litter-green", category: "litter", tag: "豆腐猫砂", title: "绿茶除臭豆腐猫砂", desc: "绿茶颗粒除臭，吸水快，适合封闭猫厕。", price: "¥28.9", priceValue: 28.9, emoji: "🍵", tone: 3, bullets: ["绿茶除臭", "吸水快", "可冲马桶"] },
  { id: "bentonite-litter", category: "litter", tag: "膨润土", title: "膨润土强结团猫砂", desc: "经典膨润土，结团紧实，脚感接近自然沙。", price: "¥19.9", priceValue: 19.9, emoji: "⚪", tone: 4, bullets: ["强结团", "脚感自然", "性价比高"] },
  { id: "litter-deodorizer", category: "litter", tag: "除臭", title: "猫砂除臭珠", desc: "撒在猫砂表面中和异味，减少频繁更换。", price: "¥15.9", priceValue: 15.9, emoji: "🧴", tone: 5, bullets: ["中和异味", "延长更换", "使用方法简单"] },
  { id: "mixed-litter", category: "litter", tag: "混合猫砂", title: "混合猫砂", desc: "豆腐+膨润土混合，兼顾结团与可冲。", price: "¥24.9", priceValue: 24.9, emoji: "🧺", tone: 0, bullets: ["兼顾结团", "可冲部分", "粉尘低"] },
  { id: "litter-scoop", category: "litter", tag: "清洁工具", title: "猫砂铲+收纳桶", desc: "加厚猫砂铲配收纳桶，清理更方便。", price: "¥12.9", priceValue: 12.9, emoji: "🪣", tone: 1, bullets: ["加厚铲面", "收纳防尘", "结实耐用"] },
  { id: "hairball-paste", category: "care", tag: "化毛", title: "化毛膏", desc: "温和润肠化毛，帮助毛球更顺畅排出。", price: "¥32", priceValue: 32, emoji: "🌿", tone: 2, bullets: ["温和化毛", "润肠", "适口性好"] },
  { id: "salmon-oil", category: "care", tag: "美毛", title: "三文鱼油 250ml", desc: "高浓度三文鱼油，Omega-3 美毛护关节。", price: "¥69", priceValue: 69, emoji: "🐟", tone: 3, bullets: ["Omega-3", "美毛亮肤", "护关节"] },
  { id: "probiotic-powder", category: "care", tag: "肠胃", title: "益生菌冻干粉", desc: "多菌株益生菌粉，换粮/软便期的肠胃缓冲。", price: "¥49.9", priceValue: 49.9, emoji: "🧫", tone: 4, bullets: ["多菌株", "换粮缓冲", "稳定肠胃"] },
  { id: "cat-multivitamin", category: "care", tag: "营养补充", title: "猫用复合维生素", desc: "日常复合维生素，覆盖挑食造成的营养缺口。", price: "¥39.9", priceValue: 39.9, emoji: "💊", tone: 5, bullets: ["复合配方", "日常补充", "挑食友好"] },
  { id: "calcium-paste-2", category: "care", tag: "骨骼", title: "钙磷营养膏", desc: "钙磷比例均衡，适合幼猫与孕期母猫。", price: "¥33.9", priceValue: 33.9, emoji: "🧴", tone: 0, bullets: ["钙磷均衡", "幼猫发育", "孕期补充"] },
  { id: "eye-care-wipe", category: "care", tag: "眼部护理", title: "眼部泪痕湿巾", desc: "温和清洁眼周泪痕，减少发炎。", price: "¥18.9", priceValue: 18.9, emoji: "👁️", tone: 1, bullets: ["温和清洁", "去泪痕", "日常护理"] },
  { id: "lazy-cat-kit", category: "toy", img: catNapping, tag: "生活用品", title: "懒猫午睡套装", desc: "猫窝、梳毛、互动玩具一起配齐，补货不用到处找。", price: "¥59 起", priceValue: 59, emoji: "😴", tone: 2, bullets: ["猫窝 + 梳毛", "适合新手家庭", "随餐凑单配送"] },
  { id: "corrugated-scratcher", category: "toy", tag: "猫抓板", title: "瓦楞纸猫抓板", desc: "加厚密实瓦楞纸，双面可抓，附赠猫薄荷。", price: "¥24.9", priceValue: 24.9, emoji: "🧶", tone: 2, bullets: ["加厚瓦楞纸", "双面可抓", "附猫薄荷"] },
  { id: "feather-wand", category: "toy", tag: "逗猫棒", title: "羽毛逗猫棒", desc: "替换头设计，羽毛 + 铃铛更吸引关注。", price: "¥19.9", priceValue: 19.9, emoji: "🪶", tone: 3, bullets: ["替换头", "羽毛铃铛", "互动解闷"] },
  { id: "catnip-plush", category: "toy", tag: "毛绒玩具", title: "猫薄荷毛绒玩具", desc: "内含猫薄荷的毛绒小老鼠，抱着啃咬减压。", price: "¥16.9", priceValue: 16.9, emoji: "🐭", tone: 4, bullets: ["内含猫薄荷", "毛绒耐咬", "减压陪伴"] },
  { id: "teaser-ball", category: "toy", tag: "自嗨玩具", title: "自嗨逗猫球", desc: "滚动会变换方向，猫咪独自在家也能玩。", price: "¥14.9", priceValue: 14.9, emoji: "⚽", tone: 5, bullets: ["自动滚动", "独自解闷", "安静耐用"] },
  { id: "sisal-cat-tree", category: "toy", tag: "猫爬架", title: "剑麻猫爬架", desc: "多层剑麻爬架，满足攀爬与磨爪双重需求。", price: "¥99", priceValue: 99, emoji: "🏗️", tone: 0, bullets: ["多层剑麻", "磨爪攀爬", "稳固底座"] },
  { id: "tunnel-toy", category: "toy", tag: "猫隧道", title: "折叠猫隧道", desc: "可折叠尼龙隧道，钻进钻出消耗精力。", price: "¥29.9", priceValue: 29.9, emoji: "🚇", tone: 1, bullets: ["可折叠", "消耗精力", "易收纳"] },
  { id: "grooming-kit", category: "grooming", img: catGrooming, tag: "护理套装", title: "梳毛护理套装", desc: "猫梳、指甲剪、泪痕湿巾一盒配齐，掉毛季也能顺手打理。", price: "¥69 起", priceValue: 69, emoji: "🪮", tone: 2, bullets: ["猫梳 + 指甲剪", "适合长毛/掉毛猫", "随餐凑单配送"] },
  { id: "de-shedding-brush", category: "grooming", tag: "梳理", title: "去浮毛梳", desc: "不锈钢梳齿去浮毛，更适合长毛与换毛季。", price: "¥25.9", priceValue: 25.9, emoji: "🪮", tone: 3, bullets: ["去浮毛", "不锈钢梳齿", "换毛季必备"] },
  { id: "nail-clipper", category: "grooming", tag: "剪甲", title: "指甲剪套装", desc: "防剪太深的设计，配锉刀，在家也能安心剪甲。", price: "¥29.9", priceValue: 29.9, emoji: "✂️", tone: 4, bullets: ["防深剪", "配锉刀", "家用安全"] },
  { id: "dry-shampoo", category: "grooming", tag: "洗护", title: "免洗泡泡香波", desc: "无需水洗的泡泡香波，适合怕水猫的清洁。", price: "¥39.9", priceValue: 39.9, emoji: "🧴", tone: 5, bullets: ["免洗", "宠物温和配方", "怕水猫友好"] },
  { id: "tear-stain-wipe", category: "grooming", tag: "眼部护理", title: "泪痕湿巾", desc: "温和清洁眼周，减少泪痕与发炎。", price: "¥18.9", priceValue: 18.9, emoji: "🧻", tone: 0, bullets: ["温和清洁", "去泪痕", "日常护理"] },
  { id: "pet-bath-glove", category: "grooming", tag: "洗护工具", title: "宠物洗澡手套", desc: "硅胶按摩手套，洗澡同时去浮毛、按摩。", price: "¥16.9", priceValue: 16.9, emoji: "🧤", tone: 1, bullets: ["硅胶按摩", "洗澡去浮毛", "防滑防抓"] },
];

export const subscriptionPlans = [
  {
    id: "trial",
    name: "试吃启动包",
    price: "¥39", priceValue: 39,
    period: "一次性",
    highlight: "最适合首次转化",
    desc: "先让猫咪投票，不满意可申请退款。",
    features: ["3 日鲜食试吃", "1 包冻干小样", "测评报告截图", "客服换粮建议"],
  },
  {
    id: "single-cat",
    name: "单猫鲜食订阅",
    price: "¥199", priceValue: 199,
    period: "每 2 周起",
    highlight: "灵活暂停",
    desc: "适合稳定吃鲜食的单猫家庭。",
    features: ["按体重估算份量", "2 种蛋白轮换", "冷链周期配送", "可随时暂停"],
  },
  {
    id: "multi-cat",
    name: "多猫省心计划",
    price: "¥359", priceValue: 359,
    period: "每 2 周起",
    highlight: "多猫家庭推荐",
    desc: "为不同猫咪建立档案，合并配送更省心。",
    features: ["最多 3 只猫档案", "口味组合发货", "用品凑单折扣", "专属客服提醒"],
  },
  {
    id: "couple-cat",
    name: "双猫尝鲜组合",
    price: "¥129", priceValue: 129,
    period: "一次性",
    highlight: "多猫首单尝鲜",
    desc: "两只猫各 3 日试吃 + 1 组冻干小样，先让每只猫投票。",
    features: ["2 只猫 3 日试吃", "不同口味分开", "1 组冻干小样", "客服换粮建议"],
  },
];

export const steps = [
  {
    title: "1. 建立猫咪档案",
    desc: "填写年龄、体重、挑食程度、肠胃状态，先理解主子的脾气。",
  },
  {
    title: "2. 生成鲜食方案",
    desc: "推荐蛋白来源、热量区间与试吃组合，不让你在配料表里迷路。",
  },
  {
    title: "3. 冷链送到门口",
    desc: "试吃合适后再订阅，周期、口味、数量都可以灵活调整。",
  },
];

export const reviews = [
  {
    name: "奶盖妈 · 新手养猫",
    text: "以前看到配料表就头大，测评后直接给了试吃方案。猫咪先闻了半天，第二天就开始主动等饭。",
  },
  {
    name: "阿布爸 · 成分党",
    text: "我最喜欢的是透明厨房模块，肉源、工艺、冷冻配送都说清楚了，不是只会喊天然。",
  },
  {
    name: "三猫家庭 · 囤货党",
    text: "多猫档案很实用，不同口味可以一起发，省掉我每个月翻购物车的时间。",
  },
];

export const recommendationFilterOptions = {
  age: ["幼猫 0-1 岁", "成猫 1-7 岁", "熟龄猫 7+"],
  weight: ["≤3kg", "3-4kg", "4-6kg", "≥6kg"],
  feeding: ["纯干粮", "干湿混合", "主食罐", "自制/鲜食"],
};

export const recommendationMatrix = [
  { age: "幼猫 0-1 岁", weight: "≤3kg", feeding: "纯干粮", issue: "挑食", rate: 72, sample: 14, plan: "幼猫温和试吃 + 少量多餐" },
  { age: "幼猫 0-1 岁", weight: "≤3kg", feeding: "干湿混合", issue: "肠胃敏感", rate: 80, sample: 18, plan: "低脂试吃 + 7 天换粮" },
  { age: "幼猫 0-1 岁", weight: "3-4kg", feeding: "主食罐", issue: "毛发状态", rate: 83, sample: 12, plan: "鸡肉温煮餐 + 梳毛用品" },
  { age: "成猫 1-7 岁", weight: "3-4kg", feeding: "纯干粮", issue: "挑食", rate: 81, sample: 28, plan: "冻干引导 + 渐进换粮" },
  { age: "成猫 1-7 岁", weight: "3-4kg", feeding: "干湿混合", issue: "肠胃敏感", rate: 89, sample: 36, plan: "鸡肉温煮餐 + 冻干肠胃小方" },
  { age: "成猫 1-7 岁", weight: "4-6kg", feeding: "干湿混合", issue: "挑食", rate: 94, sample: 42, plan: "鸡肉温煮餐 + 冻干小方" },
  { age: "成猫 1-7 岁", weight: "4-6kg", feeding: "主食罐", issue: "毛发状态", rate: 88, sample: 31, plan: "高动物蛋白鲜食订阅" },
  { age: "成猫 1-7 岁", weight: "4-6kg", feeding: "自制/鲜食", issue: "多猫省心", rate: 91, sample: 22, plan: "订阅补货 + 用品组合" },
  { age: "成猫 1-7 岁", weight: "≥6kg", feeding: "纯干粮", issue: "体重管理", rate: 75, sample: 26, plan: "控热量计划 + 份量解释" },
  { age: "成猫 1-7 岁", weight: "≥6kg", feeding: "干湿混合", issue: "体重管理", rate: 84, sample: 33, plan: "控热量鲜食订阅" },
  { age: "熟龄猫 7+", weight: "3-4kg", feeding: "主食罐", issue: "肠胃敏感", rate: 82, sample: 20, plan: "低脂鲜食 + 慢速换粮" },
  { age: "熟龄猫 7+", weight: "4-6kg", feeding: "干湿混合", issue: "肠胃敏感", rate: 86, sample: 24, plan: "温和蛋白 + 观察便便" },
  { age: "熟龄猫 7+", weight: "4-6kg", feeding: "自制/鲜食", issue: "毛发状态", rate: 84, sample: 17, plan: "鲜食订阅 + 护理用品" },
  { age: "熟龄猫 7+", weight: "≥6kg", feeding: "纯干粮", issue: "体重管理", rate: 70, sample: 15, plan: "控热量试吃 + 兽医建议" },
  { age: "熟龄猫 7+", weight: "≥6kg", feeding: "主食罐", issue: "多猫省心", rate: 78, sample: 13, plan: "多猫省心计划" },
  { age: "幼猫 0-1 岁", weight: "≤3kg", feeding: "自制/鲜食", issue: "肠胃敏感", rate: 79, sample: 11, plan: "低脂温和试吃 + 少量多餐" },
  { age: "幼猫 0-1 岁", weight: "3-4kg", feeding: "纯干粮", issue: "肠胃敏感", rate: 77, sample: 15, plan: "温和换粮 + 冻干肠胃小方" },
  { age: "幼猫 0-1 岁", weight: "3-4kg", feeding: "干湿混合", issue: "挑食", rate: 82, sample: 16, plan: "冻干引导 + 温热肉香" },
  { age: "幼猫 0-1 岁", weight: "≤3kg", feeding: "主食罐", issue: "多猫省心", rate: 74, sample: 8, plan: "多猫组合试吃" },
  { age: "成猫 1-7 岁", weight: "≤3kg", feeding: "纯干粮", issue: "挑食", rate: 79, sample: 22, plan: "小份试吃 + 定时定量" },
  { age: "成猫 1-7 岁", weight: "≤3kg", feeding: "主食罐", issue: "肠胃敏感", rate: 85, sample: 18, plan: "鸡肉温煮餐 + 冻干肠胃小方" },
  { age: "成猫 1-7 岁", weight: "≤3kg", feeding: "自制/鲜食", issue: "毛发状态", rate: 86, sample: 14, plan: "高动物蛋白鲜食订阅" },
  { age: "成猫 1-7 岁", weight: "3-4kg", feeding: "主食罐", issue: "体重管理", rate: 83, sample: 21, plan: "控热量鲜食 + 份量建议" },
  { age: "成猫 1-7 岁", weight: "4-6kg", feeding: "纯干粮", issue: "毛发状态", rate: 84, sample: 25, plan: "鲜食订阅 + 护理用品" },
  { age: "成猫 1-7 岁", weight: "≥6kg", feeding: "主食罐", issue: "挑食", rate: 76, sample: 19, plan: "控热量试吃 + 定时定量" },
  { age: "成猫 1-7 岁", weight: "≥6kg", feeding: "自制/鲜食", issue: "多猫省心", rate: 87, sample: 16, plan: "多猫省心计划" },
  { age: "熟龄猫 7+", weight: "≤3kg", feeding: "纯干粮", issue: "肠胃敏感", rate: 75, sample: 12, plan: "低脂温和试吃" },
  { age: "熟龄猫 7+", weight: "≤3kg", feeding: "干湿混合", issue: "挑食", rate: 78, sample: 10, plan: "温热肉香 + 少量多餐" },
  { age: "熟龄猫 7+", weight: "3-4kg", feeding: "纯干粮", issue: "挑食", rate: 76, sample: 14, plan: "小份试吃 + 冻干引导" },
  { age: "熟龄猫 7+", weight: "4-6kg", feeding: "纯干粮", issue: "体重管理", rate: 72, sample: 16, plan: "控热量鲜食订阅" },
  { age: "熟龄猫 7+", weight: "≥6kg", feeding: "干湿混合", issue: "多猫省心", rate: 79, sample: 11, plan: "多猫省心计划" },
  { age: "熟龄猫 7+", weight: "4-6kg", feeding: "主食罐", issue: "毛发状态", rate: 85, sample: 13, plan: "鲜食订阅 + 梳毛用品" },
];

export const faqs = [
  {
    q: "我的猫很挑食，真的适合吗？",
    a: "适合先从小份试吃开始。页面核心承诺是“猫咪不爱吃，全额包退”，正式上线可接入售后流程与试吃反馈记录。",
  },
  {
    q: "鲜食需要每天自己计算克数吗？",
    a: "不需要。测评会根据体重、年龄、活动量和目标状态推荐每日份量，订阅后按周期配送。",
  },
  {
    q: "除了主食，还能买什么？",
    a: "官网设计了综合商城入口，可承接冻干、猫条、梳毛用品、猫窝和订阅补货，实现一站式养猫。",
  },
  {
    q: "现在没有后台，线索怎么收？",
    a: "MVP 阶段先把表单结果保存到浏览器并预留第三方表单接口；上线时可接飞书多维表格、Formspree、金数据或企业微信客服。",
  },
  {
    q: "下单后多久能收到？",
    a: "工作日 16:00 前下单当天处理，48 小时内发出；全程 -18°C 冷链运输，一般 1-3 天送达，配送范围以收货地址校验为准。",
  },
  {
    q: "猫咪不爱吃能退吗？",
    a: "可以。首单试吃装签收 7 天内猫咪确实不爱吃（剩余超过一半）可申请全额退款，无需退货，每个用户/地址限一次。",
  },
  {
    q: "订阅到期前可以暂停或取消吗？",
    a: "可以随时暂停或取消，在下次发货前 48 小时操作即可生效；已发货周期不支持退款，未发货周期全额退还。",
  },
  {
    q: "肠胃敏感或熟龄猫适合你们的产品吗？",
    a: "测评会按年龄段和肠胃状态推荐方案，肠胃敏感和熟龄猫有低脂温和的鸭肉温补餐可选，有基础疾病建议先咨询兽医。",
  },
  {
    q: "会不会用诱食剂？配料安全吗？",
    a: "全线 0 谷物、0 胶质、0 诱食剂，原切肉低温温煮，肉源批次可追溯，并由兽医营养顾问参与共创食谱。",
  },
  {
    q: "怎么联系人工客服？",
    a: "可在对话框内输入「转人工」或点击人工按钮，留下猫名和联系方式，我们会尽快回访；紧急售后问题建议同时电话联系。",
  },
  {
    q: "有没有针对多猫家庭的方案？",
    a: "有。「多猫省心计划」支持最多 3 只猫档案、口味组合发货、用品凑单折扣；首单可先选「双猫尝鲜组合」试吃。",
  },
];

export const quizOptions = {
  ages: ["幼猫 0-1 岁", "成猫 1-7 岁", "熟龄猫 7 岁以上"],
  picky: ["不挑食", "偶尔挑食", "非常挑食"],
  goals: ["改善挑食", "肠胃更稳定", "控制体重", "毛发更顺亮", "一站式省心补货"],
  contacts: ["微信", "手机号", "邮箱"],
};

export type QuizLead = {
  catName: string;
  age: string;
  weight: string;
  picky: string;
  goals: string[];
  contactType: string;
  contact: string;
  note?: string;
  submittedAt: string;
};
