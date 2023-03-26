function sheep(option = {}) {
  const config = {
    box: ".sheep", //外壳
    plat: "ul", //生成场地
    platWidth: 0, //场地宽
    platHeight: 0, //场地高
    limits: { MinX: 0, MinY: 0 }, //场地坐标
    itemWidth: 0, //物品宽
    itemHeight: 0, //物品高
    quantity: 12, //每一类物品的数量
    type: ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p"], //物品类别类名
    isCover: null, //是否被覆盖
    noCover: [], //没有被覆盖的
    paling: ".paling", //放置栏
    palingX: 0, //放置栏坐标X
    palingY: 0, //放置栏坐标Y
    palingAmount: 7, //放置栏可放置数量
    palingLastX: 0, //放置栏下一个物品放置的坐标
    palingInfo: [], //在放置栏内的物品组
    classObj: {}, //统计放置栏物品的同类型数量
    afresh: ".reorganize", //洗牌道具
    transitionDuration: 0, //过渡时间
    ...option, //参数合并
  };

  const method = {
    //初始化
    init() {
      config.box = document.querySelector(config.box); //获取外壳
      config.plat = config.box.querySelector(config.plat); //获取场地元素
      config.paling = config.box.querySelector(config.paling); //获取放置栏元素
      config.afresh = config.box.querySelector(config.afresh); //获取道具元素
      config.platWidth = config.plat.offsetWidth; //场地宽
      config.platHeight = config.plat.offsetHeight; //场地高
      config.limits.MinX = config.plat.offsetLeft; //场地坐标X
      config.limits.MinY = config.plat.offsetTop; //场地坐标Y
      config.itemWidth = config.plat.firstElementChild.offsetWidth; //物品宽
      config.itemHeight = config.plat.firstElementChild.offsetHeight; //物品高
      config.transitionDelay =
        parseFloat(getComputedStyle(config.plat.firstElementChild).transitionDuration) * 1000; //过渡时间
      config.palingX = config.paling.offsetLeft; //放置栏坐标X
      config.palingY = config.paling.offsetTop; //放置栏坐标Y
      config.paling.style = `left:${config.palingX}px;margin:0;`; //固定放置栏
      config.paling.style.width = config.itemWidth * config.palingAmount + "px";
      config.palingLastX = config.palingX; //放置栏下一个物品放置的坐标
      config.afresh.style.top = config.palingY + config.paling.offsetHeight + 30 + "px"; //固定洗牌道具
      config.afresh.style.left =
        config.palingX + config.paling.offsetWidth / 2 - config.afresh.offsetWidth / 2 + "px";

      this.checkCover(); //元素是否被覆盖监听创建
      this.batch(); //批量生成
      config.afresh.onclick = this.reorganize.bind(this); //洗牌道具绑定
    },
    //覆盖监听
    checkCover() {
      // IntersectionObserver交叉观察器
      config.isCover = new IntersectionObserver(
        entries => {
          entries.forEach(item => {
            // 判断物品是否被覆盖，true为不被覆盖，false为被覆盖
            if (item.isVisible) {
              item.target.style[
                "background-image"
              ] = `url(images/sheep/${item.target.className}.gif)`;
              item.target.onclick = this.clickPick.bind(this); //添加点击事件
              item.target.style.zIndex = 200; //置顶
            } else {
              item.target.style[
                "background-image"
              ] = `url(images/sheep/${item.target.className}s.gif)`;
              item.target.onclick = null; //移除点击事件
            }
          });
        },
        {
          threshold: [0.9], //可见度，1为完全暴露触发，0.1为10%暴露触发
          delay: 100, //延迟
          trackVisibility: true, //跟踪目标可见性更改，若false或不写,isVisible永远false
        }
      );
    },
    //批量生成
    batch() {
      config.type.forEach(item => {
        for (let i = 0, len = config.quantity; i < len; i++) {
          this.createItem(item); //遍历图片类型，每种图片各生成quantity个
        }
      });
    },
    //生成单个项
    createItem(className) {
      //生成随机坐标
      let seat = this.randomSeat();
      let li = document.createElement("li"); //创建
      li.style.left = seat.x + "px"; //定位
      li.style.top = seat.y + "px";
      li.style.zIndex = seat.z;
      li.className = className; //分类
      config.plat.appendChild(li); //生成li
      config.isCover.observe(li); //开始监听元素是否被覆盖
    },
    //生成随机坐标
    randomSeat() {
      let x = Math.round(
        Math.random() * (config.platWidth - config.itemWidth) + config.limits.MinX
      );
      let y = Math.round(
        Math.random() * (config.platHeight - config.itemHeight) + config.limits.MinY
      );
      let z = Math.round(Math.random() * 99 + 1);
      return { x, y, z };
    },
    //物品点击放置
    clickPick(e) {
      that = e.target;

      that.style.zIndex = 199; //防止沿途覆盖导致闪烁

      config.isCover.unobserve(that); //移除可见监听
      that.onclick = null; //移除点击事件

      that.style.left = config.palingLastX + "px"; //物品移动到放置栏
      that.style.top = config.palingY + "px";

      config.palingLastX += config.itemWidth; //放置栏下一个物品放置的坐标更新
      config.palingInfo.push(that); //放置栏数组物品添加

      let className = that.className;
      //若放置栏有当前种类物品，则classObj内同类型计数+1
      if (config.classObj[className]) {
        //若放置栏有当前种类物品已达到三个，则执行消除，计数清0
        if (++config.classObj[className] == 3) {
          this.eliminate(className); //传入需要消除的物品类名
          config.classObj[className] = 0;
        }
      } else {
        config.classObj[className] = 1; //不存在则添加新计数
      }

      //是否淘汰
      setTimeout(() => {
        if (config.palingInfo.length >= config.palingAmount) {
          this.gameOver();
        }
      }, config.transitionDelay);
    },
    //消除
    eliminate(className) {
      let keepItem = []; //存放不需要移除的物品
      //遍历放置栏
      config.palingInfo.forEach(item => {
        //若当前项类名不同于需要移除的类名，添加到keepItem数组
        if (item.className != className) {
          keepItem.push(item);
        } else {
          //动画结束后,需要移除项执行移除函数
          setTimeout(() => {
            item.remove();
          }, config.transitionDelay);
        }
      });
      config.palingInfo = keepItem; //替换

      //消除后,前空位补齐
      if (config.palingInfo.length) {
        setTimeout(() => {
          config.palingInfo.forEach((item, index) => {
            let left = config.palingX + index * config.itemWidth;
            item.style.left = left + "px";
            config.palingLastX = left + config.itemWidth;
          });
        }, config.transitionDelay);
      } else {
        config.palingLastX = config.palingX;
      }

      //判断是否获胜
      setTimeout(() => {
        if (config.plat.querySelectorAll("li").length === 1) {
          this.win();
        }
      }, config.transitionDelay);
    },
    //淘汰
    gameOver() {
      alert("GAME OVER!");
      config.palingInfo = []; //防止无限触发alert
      //禁止继续点击
      document.addEventListener(
        "click",
        e => {
          e.stopPropagation();
          e.preventDefault();
        },
        true
      );
    },
    //洗牌
    reorganize() {
      let lis = config.plat.querySelectorAll("li");
      lis.forEach(item => {
        //判断是否已经在放置栏
        if (config.palingInfo.indexOf(item) === -1) {
          let seat = this.randomSeat(); //随机位置生成
          item.style.left = seat.x + "px";
          item.style.top = seat.y + "px";
          item.style.zIndex = seat.z;
        }
      });
    },
    //获胜
    win() {
      document.body.innerHTML = "<h1>YOU WIN !!!</h1>";
    },
  };
  method.init();
}

