(()=>{"use strict";var e={827:(e,t,a)=>{var i=a(795);t.H=i.createRoot,i.hydrateRoot},795:e=>{e.exports=window.ReactDOM}},t={};function a(i){var o=t[i];if(void 0!==o)return o.exports;var r=t[i]={exports:{}};return e[i](r,r.exports,a),r.exports}a.n=e=>{var t=e&&e.__esModule?()=>e.default:()=>e;return a.d(t,{a:t}),t},a.d=(e,t)=>{for(var i in t)a.o(t,i)&&!a.o(e,i)&&Object.defineProperty(e,i,{enumerable:!0,get:t[i]})},a.o=(e,t)=>Object.prototype.hasOwnProperty.call(e,t);const i=window.wp.domReady;var o=a.n(i);const r=window.wp.url,l=window.prcChartBuilder,n=window.prcFunctions;var s=a(827);const c={general:["#436983","#bf3927","#756a7e","#ea9e2c"],"politics-main":["#d1a730","#a55a26","#949d48"],"global-main":["#949d48","#006699","#a55a26"],"religion-main":["#0090bf","#a55a26","#949d48"],"social-trends-main":["#377668","#d1a730","#949d48"],"journalism-main":["#733d47","#d1a730","#949d48"],"internet-main":["#006699","#949d48","#d1a730"],"hispanic-main":["#a55a26","#d1a730","#949d48"],"politics-spectrum":["#D1A730","#F6EED6","#ECDBAC","#E4CB83","#9E7F2D","#6A5522"],"global-spectrum":["#949D48","#EAECD8","#D6DAB3","#C2C98B","#6E7537","#494E24"],"religion-spectrum":["#0090C0","#C9DEEE","#9DC7E1","#71B2D6","#0073A5","#00557E"],"journalism-spectrum":["#733D47","#E8D3D7","#D1A8AF","#BC7B86","#552E35","#391E22"],"social-trends-spectrum":["#387668","#D1E9E4","#A2D2C8","#64B6AA","#005645","#003A2C"],"hispanic-spectrum":["#A55A26","#F2DBCD","#E7BA9A","#DE996A","#7C441C","#532E16"],"internet-spectrum":["#006699","#C9D1E1","#9DAECB","#7591B7","#004A75","#002748"],"blue-spectrum":["#456A83","#D5E1E9","#ACC4D3","#82A6BF","#335062","#213441"],"green-spectrum":["#949D48","#EAECD8","#D6DAB3","#C2C98B","#6E7537","#494E24"],"purple-spectrum":["#746A7E","#E3E1E5","#C7C1CB","#ACA4B1","#584F5E","#3A343F"],"medium-brown-spectrum":["#A55A26","#F2DBCD","#E7BA9A","#DE996A","#7C441C","#532E16"],"light-brown-spectrum":["#D1A730","#F6EED6","#ECDBAC","#E4CB83","#9E7F2D","#6A5522"],"orange-spectrum":["#EA9E2C","#F9EAD4","#F5D6A9","#F1C37F","#BB792A","#7C5220"],"red-spectrum":["#BF3B27","#F5D4CF","#EBABA2","#E37F73","#902D1E","#5F1D14"]};window.wp.apiFetch;const d=e=>e.split(",").map(Number).filter((e=>!Number.isNaN(e))),m=(e,t,a,i,o)=>Number.isNaN(e)||Number.isNaN(t)?[0,100]:"bar"===a&&"x"===o||"stacked-bar"===a&&"x"===o||"dot-plot"===a&&"x"===o||"pie"===a?null:"time"===i&&"x"===o?[new Date(e,0),new Date(t,0)]:[parseFloat(e),parseFloat(t)],b=(e,t)=>"time"===t?e.map((e=>new Date(`${e}`))):e,h=window.ReactJSXRuntime,u=(0,h.jsxs)("svg",{width:"10",height:"10",viewBox:"0 0 44 44","aria-hidden":"true",focusable:"false",children:[(0,h.jsx)("path",{d:"M0.549989 4.44999L4.44999 0.549988L43.45 39.55L39.55 43.45L0.549989 4.44999Z"}),(0,h.jsx)("path",{d:"M39.55 0.549988L43.45 4.44999L4.44999 43.45L0.549988 39.55L39.55 0.549988Z"})]}),p=({onClickFacebook:e,onClickTwitter:t,pngAttrs:a,elementId:i})=>{function o(e){document.querySelector(`#modal-overlay-${e}`).classList.remove("active"),document.querySelector(`#modal-${e}`).classList.remove("active")}const{id:r,url:l}=a;return(0,h.jsxs)(h.Fragment,{children:[(0,h.jsx)("div",{className:"share-modal__overlay",id:`modal-overlay-${i}`,onClick:e=>{e.preventDefault(),o(i)}}),(0,h.jsx)("div",{className:"share-modal",id:`modal-${i}`,children:(0,h.jsxs)("div",{className:"share-modal__inner",children:[(0,h.jsxs)("div",{className:"share-modal__header",children:[(0,h.jsx)("h2",{className:"share-modal__title",children:"Share this chart:"}),(0,h.jsx)("button",{type:"button","aria-label":"Close",className:"share-modal__close",onClick:e=>{e.preventDefault(),o(i)},children:u})]}),(0,h.jsxs)("div",{className:"share-modal__body",children:[(0,h.jsx)("button",{type:"button",className:"share-modal__button share-modal__button--twitter",onClick:t,children:(0,h.jsx)("span",{children:"Share on X"})}),(0,h.jsx)("button",{type:"button",className:"share-modal__button share-modal__button--facebook",onClick:e,children:(0,h.jsx)("span",{children:"Share on Facebook"})}),a.id&&(0,h.jsx)(h.Fragment,{children:(0,h.jsx)("a",{className:"share-modal__download-png",href:l,download:`chart-${r}.png`,children:(0,h.jsx)("span",{children:"Download .png image"})})})]})]})})]})};new DOMParser;const{innerWidth:g,innerHeight:f}=window,v=()=>{document.querySelectorAll(".wp-chart-builder-wrapper").forEach((e=>{const t=e.querySelector(".wp-chart-builder-inner"),a=(0,s.H)(t),i=(e=>{const t=e.dataset.chartHash,a=window.chartConfigs[t],i=((e,t,a="wp-chart-builder-wrapper",i=null)=>{const{chartType:o,chartOrientation:r,paddingTop:n,paddingRight:s,paddingBottom:h,paddingLeft:u,height:p,width:g,overflowX:f,mobileBreakpoint:v,horizontalRules:k}=e,{metaTextActive:x,metaTitle:C,metaSubtitle:y,metaNote:w,metaSource:A,metaTag:S}=e,{showXMinDomainLabel:L,xAbbreviateTicks:D,xAbbreviateTicksDecimals:F,xTicksToLocaleString:B,xAxisActive:E,xAxisStroke:T,xGridStroke:P,xGridStrokeDasharray:W,xGridOpacity:O,xLabel:j,xLabelFontSize:_,xLabelTextFill:M,xLabelPadding:q,xLabelMaxWidth:N,xMaxDomain:z,xMinDomain:U,xScale:$,xDateFormat:R,xTickExact:V,xTickLabelAngle:I,xTickLabelMaxWidth:H,xTickLabelDX:X,xTickLabelDY:G,xTickLabelTextAnchor:Y,xTickLabelVerticalAnchor:Z,xTickMarksActive:K,xTickNum:Q,xTickUnit:J,xTickUnitPosition:ee}=e,{yAxisStroke:te,yGridStroke:ae,yGridStrokeDasharray:ie,yGridOpacity:oe,yAxisActive:re,yScale:le,yScaleFormat:ne,yLabel:se,yLabelFontSize:ce,yLabelTextFill:de,yLabelPadding:me,yLabelMaxWidth:be,yMinDomain:he,yMaxDomain:ue,showYMinDomainLabel:pe,yTickMarksActive:ge,yTickNum:fe,yTickExact:ve,yTickUnit:ke,yTickUnitPosition:xe,yTickLabelAngle:Ce,yTickLabelMaxWidth:ye,yTickLabelVerticalAnchor:we,yTickLabelTextAnchor:Ae,yTickLabelDY:Se,yTickLabelDX:Le,yAbbreviateTicks:De,yAbbreviateTicksDecimals:Fe,yTicksToLocaleString:Be}=e,{labelsActive:Ee,showFirstLastPointsOnly:Te,labelPositionDX:Pe,labelPositionDY:We,labelAbsoluteValue:Oe,labelFormatValue:je,labelUnit:_e,labelUnitPosition:Me,barLabelPosition:qe,barLabelCutoff:Ne,barLabelCutoffMobile:ze,labelColor:Ue,labelFontSize:$e,labelFontWeight:Re,labelTruncateDecimal:Ve,labelToFixedDecimal:Ie}=e,{legendActive:He,legendOrientation:Xe,legendCategories:Ge,legendTitle:Ye,legendOffsetX:Ze,legendOffsetY:Ke,legendAlignment:Qe,legendMarkerStyle:Je,legendBorderStroke:et,legendFill:tt,legendLabelDelimiter:at,legendLabelLower:it,legendLabelUpper:ot}=e,{tooltipActive:rt,tooltipActiveOnMobile:lt,tooltipHeaderActive:nt,tooltipHeaderValue:st,tooltipMaxHeight:ct,tooltipMaxWidth:dt,tooltipMinWidth:mt,tooltipMinHeight:bt,tooltipOffsetX:ht,tooltipOffsetY:ut,tooltipFormat:pt,tooltipDateFormat:gt,tooltipFormatValue:ft,tooltipAbsoluteValue:vt,deemphasizeSiblings:kt,deemphasizeOpacity:xt}=e,{pieCategoryLabelsActive:Ct}=e,{barPadding:yt,barGroupPadding:wt}=e,{positiveCategories:At,negativeCategories:St,neutralCategory:Lt,divergingBarPercentOfInnerWidth:Dt,neutralBarSeparator:Ft,neutralBarActive:Bt,neutralBarOffsetX:Et,neutralBarSeparatorOffsetX:Tt}=e,{dotPlotConnectPoints:Pt,dotPlotConnectPointsStroke:Wt,dotPlotConnectPointsStrokeWidth:Ot,dotPlotConnectPointsStrokeDasharray:jt}=e,{lineStrokeDashArray:_t,lineInterpolation:Mt,lineStrokeWidth:qt,lineNodes:Nt,nodeSize:zt,nodeStrokeWidth:Ut,nodeFill:$t,areaFillOpacity:Rt}=e,{explodedBarColumnGap:Vt}=e,{plotBandsActive:It,plotBands:Ht}=e,{diffColumnActive:Xt,diffColumnCategory:Gt,diffColumnHeader:Yt,diffColumnMarginLeft:Zt,diffColumnBackgroundColor:Kt,diffColumnHeightOffset:Qt,diffColumnWidth:Jt,diffColumnAppearance:ea}=e,{colorValue:ta,customColors:aa,elementHasStroke:ia}=e,{sortOrder:oa,categories:ra,availableCategories:la,dateInputFormat:na,sortKey:sa}=e,{mapShowCountyBoundaries:ca,mapShowStateBoundaries:da,mapPathBackgroundFill:ma,mapPathStroke:ba,mapBlockRectSize:ha,mapIgnoreSmallStateLabels:ua,mapScale:pa,mapScaleDomain:ga}=e,fa=d(V),va=d(ve);return{...l.baseConfig,layout:{...l.baseConfig.layout,name:`chart-builder-chart-${t}`,parentClass:a,type:"area"===o?"line":o,orientation:r,width:g,height:p,overflowX:f,padding:{top:n,bottom:h,left:u,right:s},horizontalRules:k,mobileBreakpoint:v},metadata:{...l.baseConfig.metadata,active:x,title:C,subtitle:y,note:w,source:A,tag:S},colors:0<aa.length?aa:c[ta],plotBands:{...l.baseConfig.plotBands,active:It,bands:Ht},independentAxis:{...l.baseConfig.independentAxis,active:E,label:j,scale:$,dateFormat:R,domain:m(U,z,o,$,"x"),showZero:L,tickCount:Q,tickValues:1>=fa.length?null:b(fa,$),tickUnit:J,tickUnitPosition:ee,tickFormat:null,abbreviateTicks:D,abbreviateTicksDecimals:F,ticksToLocaleString:B,tickLabels:{...l.baseConfig.independentAxis.tickLabels,angle:I,verticalAnchor:Z,textAnchor:Y,dy:G,dx:X,fontSize:_,padding:0,fill:M,fontFamily:"'franklin-gothic-urw', Verdana, Geneva, sans-serif",maxWidth:H},axisLabel:{...l.baseConfig.independentAxis.axisLabel,fontSize:_,fill:M,padding:q,angle:0,dx:0,dy:0,textAnchor:"middle",verticalAnchor:"middle",fontFamily:"'franklin-gothic-urw', Verdana, Geneva, sans-serif",maxWidth:N},axis:{...l.baseConfig.independentAxis.axis,stroke:T,strokeWidth:1},ticks:{...l.baseConfig.independentAxis.ticks,stroke:T,size:K?5:0,strokeWidth:1},grid:{...l.baseConfig.independentAxis.grid,stroke:P,strokeOpacity:O,strokeWidth:1,strokeDasharray:W}},dependentAxis:{...l.baseConfig.dependentAxis,active:re,label:se,scale:le,domain:m(he,ue,o,le,"y"),showZero:pe,tickCount:fe,tickValues:1>=va.length?null:b(va,le),tickUnit:ke,tickUnitPosition:xe,tickAngle:Ce,tickFormat:null,abbreviateTicks:De,abbreviateTicksDecimals:Fe,ticksToLocaleString:Be,customTickFormat:null,tickLabels:{...l.baseConfig.dependentAxis.tickLabels,angle:Ce,verticalAnchor:we,textAnchor:Ae,dy:Se,dx:Le,fontSize:ce,fill:de,padding:15,fontFamily:"'franklin-gothic-urw', Verdana, Geneva, sans-serif",maxWidth:ye},axisLabel:{...l.baseConfig.dependentAxis.axisLabel,fontSize:ce,fill:de,padding:me,angle:270,dx:0,dy:0,textAnchor:"middle",verticalAnchor:"middle",fontFamily:"'franklin-gothic-urw', Verdana, Geneva, sans-serif",maxWidth:be},ticks:{...l.baseConfig.dependentAxis.ticks,stroke:te,size:ge?5:0,strokeWidth:1},axis:{...l.baseConfig.dependentAxis.axis,stroke:te,strokeWidth:1},grid:{...l.baseConfig.dependentAxis.grid,stroke:ae,strokeOpacity:oe,strokeWidth:1,strokeDasharray:ie}},dataRender:{...l.baseConfig.dataRender,x:"x",y:"y",x2:null,y2:null,sortKey:sa,sortOrder:oa,categories:0<ra.length?ra:la,xScale:$,yScale:le,mapScale:pa,mapScaleDomain:ga,xFormat:na,yFormat:ne,numberFormat:"en-US",isHighlightedColor:"#ECDBAC"},animate:{active:!1,animationWhitelist:[],duration:2e3},events:{...l.baseConfig.events,click:i},tooltip:{...l.baseConfig.tooltip,active:rt,activeOnMobile:lt,deemphasizeSiblings:kt,deemphasizeOpacity:xt,headerActive:nt,headerValue:st,format:pt,offsetX:ht,offsetY:ut,abbreviateValue:!1,absoluteValue:vt,toFixedDecimal:0,toLocaleString:ft,customFormat:null,rlsFormat:!1,dateFormat:gt,style:{...l.baseConfig.tooltip.style,maxWidth:dt,maxHeight:ct,minHeight:bt,minWidth:mt,width:"auto",height:"auto",fontSize:"13px",fontFamily:"'franklin-gothic-urw', Verdana, Geneva, sans-serif",background:"white",border:"1px solid #CBCBCB",padding:"10px",borderRadius:"0px",color:"black"}},legend:{...l.baseConfig.legend,active:He,orientation:Xe,categories:Ge||ra,title:Ye,offsetX:Ze,offsetY:Ke,alignment:Qe,markerStyle:Je,borderStroke:et,fill:tt,labelDelimiter:at,labelLower:it,labelUpper:ot},bar:{...l.baseConfig.bar,hasRectStroke:ia,barPadding:yt,barGroupPadding:wt},line:{...l.baseConfig.line,interpolation:Mt,strokeDasharray:_t,strokeWidth:qt,showPoints:Nt,showArea:"area"===o,areaFillOpacity:Rt},dotPlot:{...l.baseConfig.dotPlot,connectPoints:Pt,connectingLine:{...l.baseConfig.dotPlot.connectingLine,stroke:Wt,strokeWidth:Ot,strokeDasharray:jt,strokeOpacity:1}},pie:{...l.baseConfig.pie,hasPathStroke:ia,pathStrokeColor:"white",pathStrokeWidth:1,showCategoryLabels:Ct},explodedBar:{...l.baseConfig.explodedBar,columnGap:Vt},map:{...l.baseConfig.map,ignoreSmallStateLabels:ua,showCountyBoundaries:ca,showStateBoundaries:da,pathBackgroundFill:ma,pathStroke:ba,blockRectSize:ha},nodes:{...l.baseConfig.nodes,pointSize:zt,pointFill:$t,pointStrokeWidth:Ut,pointCustomSize:null},labels:{...l.baseConfig.labels,active:Ee,showFirstLastPointsOnly:Te,color:Ue,fontWeight:Re,fontSize:$e,fontFamily:"'franklin-gothic-urw', Verdana, Geneva, sans-serif",labelPositionBar:qe,labelCutoff:Ne,labelCutoffMobile:ze,labelPositionDX:Pe,labelPositionDY:We,pieLabelRadius:60,abbreviateValue:!1,toLocaleString:je,absoluteValue:Oe,truncateDecimal:Ve,toFixedDecimal:Ie,labelUnit:_e,labelUnitPosition:Me,textAnchor:"middle",customLabelFormat:null},voronoi:{...l.baseConfig.voronoi,active:!1,fill:"#756a7e",stroke:"#ccc",strokeWidth:1,strokeOpacity:.5},regression:{...l.baseConfig.regression,active:!1,type:"linear",stroke:"#2a2a2a",strokeWidth:2,strokeDasharray:"1"},divergingBar:{...l.baseConfig.divergingBar,positiveCategories:At,negativeCategories:St,netPositiveCategory:"y4",netNegativeCategory:"y5",percentOfInnerWidth:Dt/100,neutralBar:{...l.baseConfig.divergingBar.neutralBar,category:Lt,offsetX:Et,active:Bt&&!!Lt&&0<Lt.length,separator:Ft,separatorOffsetX:Tt}},diffColumn:{...l.baseConfig.diffColumn,active:Xt,category:Gt,columnHeader:Yt,style:{...l.baseConfig.diffColumn.style,rectStrokeWidth:0,rectStrokeColor:"white",rectFill:Kt,fontWeight:"bold"===ea||"bold-italic"===ea?"bold":"normal",fontStyle:"italic"===ea||"bold-italic"===ea?"italic":"normal",headerFontSize:"12px",marginLeft:Zt,width:Jt,heightOffset:Qt}}}})(a,t,"wp-chart-builder-wrapper"),{isStaticChart:o,staticImageId:r,staticImageUrl:n,staticImageAltText:s,tabsActive:h}=a;return{...i,staticImageId:r,staticImageUrl:n,isStaticChart:o,staticImageAltText:s,tabsActive:h}})(t),o=t.dataset.chartHash,u=e.querySelector(".wp-chart-builder-table"),v=e.querySelector(".wp-chart-builder-download"),k=e.querySelector(".download-svg"),x=e.querySelector(".wp-chart-builder-view-buttons"),{isStaticChart:C,staticImageId:y,staticImageUrl:w,tabsActive:A}=i,{postId:S,postUrl:L,postPubDate:D,rootUrl:F}=t.dataset,B={url:C?w:window.chartConfigs[o].pngUrl,id:C?y:window.chartConfigs[o].pngId},E=!!u&&window.tableData[u.id],T=window.chartPreformattedData[o],{chartData:P}=window.chartConfigs[o],W=T||P,O=!!(A&&E&&!E.errors&&E.rows.length>0)&&(0,n.arrayToCSV)([E.header,...E.rows],{title:i.metadata.title,subtitle:i.metadata.subtitle,note:i.metadata.note,source:i.metadata.source,tag:i.metadata.tag});v&&O&&v.addEventListener("click",(e=>{e.preventDefault();const t=new Blob([O],{type:"text/csv"}),a=URL.createObjectURL(t),o=document.createElement("a"),r=i.metadata.title.toLowerCase().replace(/\s+/g,"_");o.setAttribute("href",a),o.setAttribute("download",`${r}_data_${D}.csv`),o.click(),e.stopPropagation()})),k&&k.addEventListener("click",(e=>(e=>{const t=document.querySelector(`[data-chart-hash="${e}"]`).querySelector("svg");t.setAttribute("xmlns","http://www.w3.org/2000/svg"),t.setAttribute("xmlns:xlink","http://www.w3.org/1999/xlink");const a=new Blob([t.outerHTML],{type:"image/svg+xml"}),i=URL.createObjectURL(a),o=document.createElement("a");o.href=i,o.download=`chart-${e}.svg`,document.body.appendChild(o),o.click(),document.body.removeChild(o)})(o))),((e,t,a,i)=>{e&&e.querySelector(".view-button--chart")&&e.querySelector(".view-button--chart").addEventListener("click",(()=>{t.classList.remove("active"),a.classList.add("active"),e.querySelectorAll(".view-button").forEach((e=>{e.classList.remove("active")})),e.querySelector(".view-button--chart").classList.add("active"),document.querySelector(`#modal-overlay-${i}`).classList.remove("active"),document.querySelector(`#modal-${i}`).classList.remove("active")})),e&&e.querySelector(".view-button--table")&&e.querySelector(".view-button--table").addEventListener("click",(()=>{t.classList.add("active"),a.classList.remove("active"),e.querySelectorAll(".view-button").forEach((e=>{e.classList.remove("active")})),e.querySelector(".view-button--table").classList.add("active")})),e&&e.querySelector(".view-button--share")&&e.querySelector(".view-button--share").addEventListener("click",(()=>{t.classList.remove("active"),a.classList.add("active"),e.querySelectorAll(".view-button").forEach((e=>{e.classList.remove("active")})),e.querySelector(".view-button--share").classList.add("active"),document.querySelector(`#modal-overlay-${i}`).classList.add("active"),document.querySelector(`#modal-${i}`).classList.add("active")}))})(x,u,t,o),a.render((0,h.jsx)("figure",{children:(0,h.jsxs)(l.ChartBuilderTextWrapper,{active:i.metadata.active,width:i.layout.width,horizontalRules:i.layout.horizontalRules,title:i.metadata.title,subtitle:i.metadata.subtitle,note:i.metadata.note,source:i.metadata.source,tag:i.metadata.tag,children:[C&&(0,h.jsx)("img",{className:"cb__static-img",src:B.url,alt:i.staticImageAltText}),!C&&(0,h.jsx)(l.ChartBuilderWrapper,{config:i,data:W}),A&&(0,h.jsx)(p,{onClickFacebook:e=>((e,t,a,i,o)=>{e.preventDefault();const l=(0,r.addQueryArgs)("https://www.facebook.com/sharer/sharer.php",{u:o.id?`${a}/share/${i}/${o.id}`:t});window.open(l,"fbShareWindow",`height=450, width=550, top=${f/2-275}, left=${g/2-225}, toolbar=0, location=0, menubar=0, directories=0, scrollbars=0`),e.stopPropagation()})(e,L,F,S,B),onClickTwitter:e=>((e,t,a,i,o,l)=>{e.preventDefault();const n=(0,r.addQueryArgs)("https://twitter.com/intent/tweet",{text:l,url:o.id?`${a}/share/${i}/${o.id}`:t});window.open(n,"twtrShareWindow",`height=450, width=550, top=${f/2-275}, left=${g/2-225}, toolbar=0, location=0, menubar=0, directories=0, scrollbars=0`),e.stopPropagation()})(e,L,F,S,B,i.metadata.title),pngAttrs:B,elementId:o})]})}),t)}))};o()((()=>{v()}))})();
//# sourceMappingURL=view.js.map