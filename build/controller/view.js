import*as t from"@wordpress/interactivity";var e={d:(t,o)=>{for(var r in o)e.o(o,r)&&!e.o(t,r)&&Object.defineProperty(t,r,{enumerable:!0,get:o[r]})},o:(t,e)=>Object.prototype.hasOwnProperty.call(t,e)};const o=(c={getContext:()=>t.getContext,getElement:()=>t.getElement,store:()=>t.store},l={},e.d(l,c),l),{arrayToCSV:r}=window.prcFunctions,{addQueryArgs:a}=window.wp.url,{innerWidth:n,innerHeight:i}=window,{state:s}=(0,o.store)("prc-block/chart-builder-controller",{state:{get isActive(){const t=(0,o.getContext)(),{id:e}=t,r=(0,o.getElement)();return r.attributes["data-chart-view"]===s[e].activeTab||r.attributes["data-allow-overlay"]&&"share"===s[e].activeTab}},actions:{setActiveTab(){const t=(0,o.getContext)(),{id:e}=t,r=(0,o.getElement)();s[e].activeTab=r.attributes["data-chart-view"]},hideModal(){const t=(0,o.getContext)(),{id:e}=t;s[e].activeTab="chart"},shareTwitter(){const t=(0,o.getContext)(),{postId:e,postUrl:r,rootUrl:s,title:c,featuredImageId:l}=t,d=a("https://twitter.com/intent/tweet",{text:c,url:l?`${s}/share/${e}/${l}`:r});window.open(d,"twtrShareWindow",`height=450, width=550, top=${i/2-275}, left=${n/2-225}, toolbar=0, location=0, menubar=0, directories=0, scrollbars=0`)},shareFacebook(){const t=(0,o.getContext)(),{postId:e,postUrl:r,rootUrl:s,featuredImageId:c}=t,l=a("https://www.facebook.com/sharer/sharer.php",{u:c?`${s}/share/${e}/${c}`:r});window.open(l,"fbShareWindow",`height=450, width=550, top=${i/2-275}, left=${n/2-225}, toolbar=0, location=0, menubar=0, directories=0, scrollbars=0`)},downloadData(t){const e=(0,o.getContext)(),{tableData:a,title:n,subtitle:i,note:s,source:c,tag:l,postPubDate:d}=e;if("keydown"===t.type&&("Enter"!==t.key||" "!==t.key))return;if(!a)return;const w=r([a.header,...a.rows],{title:n,subtitle:i,note:s,source:c,tag:l}),b=new Blob([w],{type:"text/csv"}),h=URL.createObjectURL(b),u=document.createElement("a"),g=n.toLowerCase().replace(/\s+/g,"_");u.setAttribute("href",h),u.setAttribute("download",`${g}_data_${d}.csv`),u.click()},downloadSVG(){const t=(0,o.getContext)(),{id:e}=t,r=document.getElementById(e).querySelector("svg");r.setAttribute("xmlns","http://www.w3.org/2000/svg"),r.setAttribute("xmlns:xlink","http://www.w3.org/1999/xlink");const a=new Blob([r.outerHTML],{type:"image/svg+xml"}),n=URL.createObjectURL(a),i=document.createElement("a");i.href=n,i.download=`chart-${e}.svg`,document.body.appendChild(i),i.click(),document.body.removeChild(i)}},callbacks:{}});var c,l;
//# sourceMappingURL=view.js.map