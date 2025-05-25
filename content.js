// 添加CSS样式，直接隐藏弹窗
function addHideDialogStyles() {
  const style = document.createElement('style');
  style.textContent = `
    /* 隐藏弹窗相关元素 */
    .t-dialog.t-dialog--default[style*="display: block"],
    .t-dialog-zoom-appear-done.t-dialog-zoom-enter-done,
    .t-dialog__mask {
      display: none !important;
      opacity: 0 !important;
      visibility: hidden !important;
    }
    
    /* 防止弹窗导致的页面锁定 */
    body.t-dialog-lock {
      overflow: auto !important;
      position: static !important;
    }
  `;
  document.head.appendChild(style);
}

// 尽早添加样式
if (document.head) {
  addHideDialogStyles();
} else {
  // 如果head还未加载，监听DOM变化直到head加载完成
  const headObserver = new MutationObserver(() => {
    if (document.head) {
      addHideDialogStyles();
      headObserver.disconnect();
    }
  });
  headObserver.observe(document.documentElement, { childList: true, subtree: true });
}

// 拦截元素创建，在弹窗被添加到DOM前进行处理
function interceptDialogCreation() {
  // 保存原始的appendChild方法
  const originalAppendChild = Element.prototype.appendChild;
  
  // 重写appendChild方法
  Element.prototype.appendChild = function(child) {
    // 检查是否是弹窗元素
    if (child && child.classList && 
        child.classList.contains('t-dialog') && 
        child.classList.contains('t-dialog--default') &&
        child.innerHTML && child.innerHTML.includes('您即将离开腾讯元宝')) {
      
      // 找到并点击"继续访问"按钮
      setTimeout(() => {
        const continueButton = child.querySelector('.t-button--theme-primary');
        if (continueButton) {
          continueButton.click();
          console.log('元宝弹窗移除器：已拦截弹窗并自动点击"继续访问"按钮');
        }
      }, 0);
      
      // 不添加弹窗到DOM
      return null;
    }
    
    // 对于其他元素，使用原始的appendChild方法
    return originalAppendChild.call(this, child);
  };
  
  // 保存原始的createElement方法
  const originalCreateElement = document.createElement;
  
  // 重写createElement方法，拦截弹窗创建
  document.createElement = function(...args) {
    const element = originalCreateElement.apply(this, args);
    
    // 在元素创建后，设置一个监听器来检测它是否会变成弹窗
    if (args[0] && args[0].toLowerCase() === 'div') {
      setTimeout(() => {
        if (element.classList && 
            element.classList.contains('t-dialog') && 
            element.classList.contains('t-dialog--default')) {
          element.style.display = 'none';
        }
      }, 0);
    }
    
    return element;
  };
}

// 执行拦截
interceptDialogCreation();

// 拦截链接点击事件，在点击链接时处理
function interceptLinkClicks() {
  // 保存原始的window.open方法
  const originalWindowOpen = window.open;
  
  // 重写window.open方法
  window.open = function(url, target, features) {
    // 如果是通过我们的代码打开的链接，直接使用原始方法
    if (window.isOurExtensionOpening) {
      window.isOurExtensionOpening = false;
      return originalWindowOpen.call(this, url, target, features);
    }
    
    // 其他情况下，记录当前状态并使用原始方法
    console.log('元宝弹窗移除器：检测到window.open调用');
    return originalWindowOpen.call(this, url, target, features);
  };
}

// 执行链接点击拦截
interceptLinkClicks();

// 原有的MutationObserver代码作为备份方案
const observer = new MutationObserver((mutations) => {
  // 检查页面上是否出现了弹窗
  const dialog = document.querySelector('.t-dialog.t-dialog--default');
  
  if (dialog && dialog.style.display === 'block') {
    // 隐藏弹窗
    dialog.style.display = 'none';
    
    // 找到"继续访问"按钮并点击
    const continueButton = dialog.querySelector('.t-button--theme-primary');
    if (continueButton) {
      continueButton.click();
      console.log('元宝弹窗移除器：已自动点击"继续访问"按钮');
    }
  }
});

// 配置观察选项
const config = { 
  childList: true,  // 观察直接子节点的变化
  subtree: true,    // 观察所有后代节点的变化
  attributes: true  // 观察属性变化
};

// 开始观察document.body的变化
if (document.body) {
  observer.observe(document.body, config);
} else {
  // 如果body还未加载，等待DOM内容加载完成
  document.addEventListener('DOMContentLoaded', () => {
    observer.observe(document.body, config);
  });
}

// 另一种处理方法：直接点击所有链接，跳过默认的点击处理
document.addEventListener('click', (event) => {
  // 检查是否点击了链接元素
  const linkElement = event.target.closest('a');
  if (linkElement && linkElement.href && !linkElement.href.includes('yuanbao.tencent.com')) {
    // 阻止默认行为
    event.preventDefault();
    
    // 标记这是我们的扩展程序触发的打开操作
    window.isOurExtensionOpening = true;
    
    // 直接打开新链接
    window.open(linkElement.href, '_blank');
    console.log('元宝弹窗移除器：直接打开外部链接 ' + linkElement.href);
  }
}, true); // 使用捕获阶段

console.log('元宝弹窗移除器已启动，优化版本'); 