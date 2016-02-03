(function($){
	/*说明：获取浏览器前缀*/
	//实现：判断某个元素的css样式中是否存在transition属性
	//参数：dom元素
	//返回值：boolean，有则返回浏览器样式前缀，否在返回false
	var _prefix = (function(temp){
		var aPrefix = ["webkit","Moz","o","ms"],
			props = "";
			for(var i in aPrefix){
				props = aPrefix[i] + "Transition";
				if (temp.style[props] !== undefined) {
					return "-"+aPrefix[i].toLowerCase()+"-";
				};
			}
			return false;
	})(document.createElement(PageSwitch));



	//PageWitch对象
	var PageSwitch = (function(){
		//对象方法
		function PageSwitch(element,options){
			//jQuery的extend方法的作用：将用户自定义的插件参数与插件的默认参数加以合并
			this.settings = $.extend(true,$.fn.PageSwitch.defaults,options||{}/*为避免参数(options)为空，设置一个默认值{}*/);
			this.element = element;
			this.init();
		}

		PageSwitch.prototype = {
			//init()方法是放在PageSwitch的原型下，所以插件的实例是可以调用init()方法的
			//有下划线的是私有方法
			//实现：初始化dom结构，布局、分页及绑定事件
			init : function(){
				var me = this;	//此处this指的是PageSwitch对象
				//下面对dom结构初始化
				me.selectors = me.settings.selectors;
				me.sections = me.element.find(me.selectors.sections);
				me.section = me.element.find(me.selectors.section);

				//对插件的属性进行初始化
				me.direction = me.settings.direction == "vertical" ? true : false;
				me.pagesCount = me.pagesCount();
				me.index = (me.settings.index>=0 && me.settings.index<me.pagesCount) ? me.settings.index : 0;

				me.canScroll = true;

				//如果是横屏就调用_initLayout方法
				if (!me.direction) {
					me._initLayout();
				};

				//实现分页dom结构及css样式
				if (me.settings.pagination) {
					me._initPaging();
				};
				//事件
				me._initEvent();
			},
			//说明：获取滑动页面数量
			pagesCount : function(){
				return this.section.length;
			},
			//说明： 获取滑动的宽度(横屏滑动) 或者高度(竖屏滑动)
			switchLength : function(){
				return this.direction ? this.element.height() : this.element.width();
			},
			//说明：向前滑动即上一页面
			prev : function(){
				var me = this;
				if (me.index > 0) {
					me.index --;
				}else if (me.settings.loop) {
					me.index = me.pagesCount -1;
				};
				me._scrollPage();
			},
			//说明：像后滑动即下一页面
			next : function(){
				var me = this;
				if (me.index < me.pagesCount) {
					me.index ++;
				}else if (me.settings.loop) {
					me.index = 0;
				};
				me._scrollPage();
			},
			//说明： 主要针对横屏滑动情况进行页面布局
			_initLayout : function(){
				var me = this;
				var width = (me.pagesCount * 100) + "%",
				    cellWidth = (100/me.pagesCount).toFixed(2) + "%";
				me.sections.width(width);
				me.section.width(cellWidth).css("float","left");
			},
			//说明： 实现分页的dom结构及css样式
			_initPaging : function(){
				var me = this,
				    pagesClass = me.selectors.page.substring(1);
				me.activeClass = me.selectors.active.substring(1);
				var pageHtml = "<ul class="+pagesClass+">";
				for (var i = 0;i<me.pagesCount;i++) {
					pageHtml += "<li></li>";
				};

				pageHtml += "</ul>";
				me.element.append(pageHtml);
				var pages = me.element.find(me.selectors.page);
				me.pageItem = pages.find("li");
				me.pageItem.eq(me.index).addClass(me.activeClass);//为当前页面分页效果添加样式

				if (me.direction) {
					pages.addClass("vertical");
				}else{
					pages.addClass("horizontal");
				};
			},
			//说明：初始化插件事件
			_initEvent : function(){
				var me = this;
				me.element.on("click",me.selectors.page + " li",function(){
					me.index = $(this).index();	//当前分页的索引值
					me._scrollPage();
				});

				me.element.on("mousewheel DOMMouseScroll", function(e){
					if (me.canScroll) {
						var delta = e.originalEvent.wheelDelta || -e.originalEvent.detail;
						//如果delta>0向上滑动，and me.index不为0
						if (delta > 0 &&(me.index && !me.settings.loop || me.settings.loop)) {
							me.prev();
						}else if (delta < 0&&(me.index<(me.pagesCount-1) && !me.settings.loop || me.settings.loop)) {
							me.next();
						};
					};

				});

				if (me.settings.keyboard) {
					$(window).on("keydown",function(e){
						var keyCode = e.keyCode;
						if (keyCode == 37 || keyCode == 38) {
							me.prev();
						}else if(keyCode==39 || keyCode==40){
							me.next();
						};
					})
				};


				$(window).resize(function(){
					var currentLength = me.switchLength(),
					    offset = me.settings.direction ? me.section.eq(me.index).offset.top : me.section.eq(me.index).offset.left;
					if (Math.abs(offset)>currentLength/2&& me.index<(me.pagesCount-1)) {
						me.index ++;
					};
					if (me.index) {
						me._scrollPage();
					};
				});

				me.sections.on("transitionend webkitTransitionEnd oTransitionEnd otransitionend",function(){
					me.canScroll = true;
					if (me.settings.callback && $.type(me.settings.callback)=="function") {
						me.settings.callback();
					};
				});
			},
			//说明：滑动动画
			_scrollPage : function(){
				
				var me = this,
					dest = me.section.eq(me.index).position();
				if (!dest) {
					return;
				};
				me.canScroll = false;
				if (_prefix) {
					me.sections.css(_prefix+"transition","all "+me.settings.duration+"ms "+me.settings.easing);
					var translate = me.direction ? "translateY(-"+dest.top+"px)" : "translateX(-"+dest.left+"px)";
					me.sections.css(_prefix+"transform",translate);
				}else{
					var animateCss = me.direction ? {top:-dest.top} : {left:-dest.left};
					me.sections.animate(animateCss,me.settings.duration,function(){
						me.canScroll = true;
						if (me.settings.callback && $.type(me.settings.callback)=="function") {
							me.settings.callback();
						};	
					});
				};
				
				if (me.settings.pagination) {
					me.pageItem.eq(me.index).addClass(me.activeClass).siblings("li").removeClass(me.activeClass);
				};
			}
		};
		//要返回这个实例
		return PageSwitch;
	})();

	$.fn.PageSwitch = function(options){
		return this.each(function(){
			var me = $(this),
			    instance = me.data("PageSwitch");
			if (!instance) {
				instance = new PageSwitch(me,options);
				me.data("PageSwitch",instance);
			};
			if ($.type(options)==="string")  return instance[options]();
			//例如：$("div").PageSwitch("init");
		});
	}


	$.fn.PageSwitch.defaults = {
		selectors : {
			sections : ".sections",	//页面上的sections
			section : ".section",	//页面上的section
			page : ".pages",	//分页
			active : ".active"	//分页被选中页
		},
		index : 0,	//分页默认值
		easing : "ease",	//动画值
		duration : 500,	//页面滑动动画所执行的事件
		loop : false,	//页面是否可以循环播放
		pagination : true,	//是否进行分页处理
		keyboard : true,	//是否触发键盘事件
		direction : "vertical",	//竖屏滑动,horizontal横屏
		callback : ""	//当实现滑屏动画调用的回调函数
	}

	// $(function(){
	// 	$("[data-PageSwitch]").PageSwitch();//初始化插件
	// });


})(jQuery);