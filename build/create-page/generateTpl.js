exports.vue = function(pageName) {

    var tpl = `<template>
    <div class="${pageName}-page fullscreen" v-cloak>
        ${pageName}
    </div>
</template>
    `;

    return tpl;
}

exports.less = function(pageName) {

    var tpl = `.${pageName}-page{

    
}`;

    return tpl;
}


exports.js = `import { utils } from 'libs';

const page = {

    data() {

        return {

        }
    },

    created() {


    },

    methods: {
        
    }
}

`;

exports.mockData = `module.exports = {
    
    
}
`;

exports.pageNav = function(data) {
    
    if(!(process.env.NODE_PLATFORM == 'app' || process.env.NODE_ENV == 'dev')) return ;

    var backIcon = data.isHasBack  ? '<span class="back-icon" id="back-icon"></span>' : '';
    
    var tpl = `<!-- 导航 -->
    <div class="nav db">
        <div class="left bm">
            ${backIcon}
        </div>
        <div class="middle db1" id="nav-title">${data.title}</div>
        <div class="right bm br">
          
        </div>
    </div>`;

    return tpl;
}

//爱回购
exports.pageTabBar = function(data) {

    let highlightFirst = data.highlightFirst ? 'selected' : '';
    let highlightSecond = data.highlightSecond ? 'selected' : ''
    let highlightThree = data.highlightThree ? 'selected' : ''

    return `
        <div class="global-tab-bar-wrap" style="display:none">
            <div class="global-tab-bar db">
                <div class = "db1 bc bm fc home ${highlightFirst} tabbar one">
                    <span class="icon one"></span> 
                    <span class="one">首页</span>
                </div>

                <div class = "db1 bc bm fc order-icon ${highlightSecond} tabbar two">
                    <span class="icon two"></span>
                    <span class="two">Rekomendasi</span>
                </div>

                <div class = "db1 bc bm my fc ${highlightThree} tabbar three">
                    <span class="icon three"></span>
                    <span class="three">Akun Saya</span>
                </div>

            </div>
        </div>
    `
}

exports.demoIntro =  "<div id='app-demo'>demo版</div>";



