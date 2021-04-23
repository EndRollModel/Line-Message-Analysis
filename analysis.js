const uploadData = document.querySelector('#uploadLineChat');
uploadData.addEventListener('change', formatLine);
const title = document.getElementById('title');
const ctxLine = document.getElementById('myLineChart');
const ctxBar = document.getElementById('myBarChart');
const ctxDoughnut = document.getElementById('myDoughnutChart');
const uploadLabel = document.getElementById('uploadLabel');
const doughnutBlock = document.getElementById('doughnut_choose_block');
const textCountCBlock = document.getElementById('text_count_choose_block');
const textCountRank = document.getElementById('text_count_rank');
const textCountDiv = document.getElementById('textCount');
const loadingImage = document.getElementById('loadingAlert');

//allData
let pageData;
// lang
let totalLang;
let textLang;
//chartObject
let lineChart;
let barChart;
let doughnutChart;
//doughnut
let doughnutLabelData = [];
let doughnutInfoData = [];
//textCount
let textCount = [];

async function formatLine(e) {
    title.style.display = 'none';
    uploadData.style.display = 'none';
    uploadLabel.style.display = 'none';
    loadingImage.style.visibility = "visible"
    const fileInfo = e.target.files[0]
    const file = await fileInfo.text();
    let dayMatch;

    const dayMatch_zh_tw = /(2[0-1][0-9][0-9])\/([0-9]|0[1-9]|1[0-2])\/((0[1-9]|[12]\d|3[01])|([1-9]|[12]\d|3[01]))（(週[一二三四五六日]|[一|二三四五六日])）/g; // 中文
    const dayMatch_en = /(Sun|Mon|Tue|Wed|Thu|Fri|Sat), ((0[1-9]|[12]\d|3[01])|([1-9]|[12]\d|3[01]))\/([0-9]|0[1-9]|1[0-2])\/((2)[0-1][0-9][0-9])/g // 英文
    // 聊天標籤
    const chatMatch = /^(0[0-9]|1[0-9]|2[0-3]):(([012345])[0-9])\t/g; // 若為聊天格式
    // 名字標籤
    const nameMatch = /\t.*?\t/g;
    // 特殊狀態
    const systemMatch = /(0[0-9]|1[0-9]|2[0-3]):(([012345])[0-9])\t.*?\t\[(檔案|照片|貼圖|禮物|影片|Video|File|Photo|Sticker)]/g // 對話內容若為傳送圖片等
    const onlySMatch = /\[(檔案|照片|貼圖|禮物|影片|Video|File|Photo|Sticker)]/g
    // 對話去除
    const chatNameMatch = /(0[0-9]|1[0-9]|2[0-3]):(([012345])[0-9])\t.*?\t/g; // 若為聊天格式
    const chatUrl = /(https:\/\/|http)/g // 網址類型去除

    // 取得第一行資訊 確認第一行是中文還是英文
    const firstLine = file.split(/\n/)[0]
    switch (true) {
        case firstLine.indexOf('Chat history') > -1:
            textLang = 'Text';
            totalLang = 'Total';
            dayMatch = dayMatch_en;
            break;
        case firstLine.indexOf('聊天記錄') > -1:
            totalLang = '全部';
            textLang = '對話';
            dayMatch = dayMatch_zh_tw;
            break;
        default: // 預設中文
            dayMatch = dayMatch_zh_tw;
            break
    }
    // 儲存物件
    const allData = {};
    allData.time = {};
    const timeTag = {'0': 0, '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0, '7': 0, '8': 0, '9': 0, '10': 0, '11': 0, '12': 0, '13': 0, '14': 0, '15': 0, '16': 0, '17': 0, '18': 0, '19': 0, '20': 0, '21': 0, '22': 0, '23': 0};
    const allChatData = {}; // 所有對話資料
    const memberChatCount = {}; // 成員對話次數
    const personChat = {};
    // 先把日期分出來切割 然後日期內 最後一行去除 在進行分類
    const dayChat = [];
    const dayIndex = [];
    const dayData = file.match(dayMatch);
    // 取得每一個日期的標籤
    dayData.forEach((elem) => {
        dayIndex.push(file.indexOf(elem));
    });
    // 取得每個日期的間隔
    dayIndex.forEach((elem, index) => {
        let thisDay
        if (index < dayIndex.length - 1) {
            thisDay = file.substr(elem, dayIndex[index + 1] - [elem])
        } else {
            thisDay = file.substr(elem);
        }
        dayChat.push(thisDay);
    })

    dayChat.forEach((elem) => {
        const formatDay = elem.split('\n');
        // 刪除最後一行換行
        formatDay.pop();
        let tempDay;
        formatDay.forEach((elem, index) => {
            if (index === 0) {
                tempDay = elem
                allChatData[tempDay] = [];
                return;
            }
            // 如果不符合發話regex(時間\t對話內容) 即為上一則發話的延續
            if (elem.match(chatMatch) !== null) {
                allChatData[tempDay].push(elem)
            } else {
                const tempS = allChatData[tempDay][allChatData[tempDay].length - 1] + elem
                // console.log(allData.length);
                allChatData[tempDay].splice(allChatData[tempDay].length - 1, 1, tempS);
            }
        })
    });

    /**
     * 資料處理部分
     * allChatData{
     *     chatData : {
     *          [對話紀錄/record],
     *     },
     *     count : {
     *         user1 : {
     *             全部 : ,
     *             照片 : ,
     *             貼圖 : ,
     *             檔案 : ,
     *             對話 : ,
     *         },
     *         user2 : {
     *             全部 : ,
     *         }
     *     },
     *     time : {
     *         全部 : {0:1 ...},
     *         user1 : {0:1 ...},
     *     },
     *     personChat:{
     *         user1 : [],
     *         user2: [],
     *     }
     * }
     */
    Object.keys(allChatData).map((elem) => { // 所有對話
        allChatData[elem].map((item, index) => { // 每日
            if (item.match(nameMatch) !== null) {
                const name = item.match(nameMatch)[0].replace(/\t/g, ''); // 使用者名稱
                // 計算發話總和
                if (memberChatCount.hasOwnProperty(name)) {
                    memberChatCount[name][totalLang]++;
                } else {
                    memberChatCount[name] = {}
                    memberChatCount[name][totalLang] = 1;
                }
                // 計算除了一般發話外的內容 傳送資訊 (貼圖/相片)
                if (item.match(systemMatch) !== null) {
                    const chatType = item.match(onlySMatch)[0].replace(/[\[\]]/g, '');
                    if (!memberChatCount[name].hasOwnProperty(chatType)) {
                        memberChatCount[name][chatType] = 1;
                    }
                    memberChatCount[name][chatType]++;
                }
                // 計算對話頻率
                const tempHour = item.match(chatMatch)[0].split(':')[0];
                let hourKey = tempHour.length === 2 && tempHour.indexOf('0') === 0 ? tempHour.replace('0', '') : tempHour; // 將0去掉
                if (!allData.time.hasOwnProperty(totalLang)) {
                    allData.time[totalLang] = JSON.parse(JSON.stringify(timeTag));
                }
                allData.time[totalLang][hourKey]++;

                const username = item.match(nameMatch)[0].replace(/\t/g, '');
                if (!allData.time.hasOwnProperty(username)) {
                    allData.time[username] = JSON.parse(JSON.stringify(timeTag))
                }
                allData.time[username][hourKey]++;
                // 對話分類
                if(item.match(onlySMatch) === null){ // 排除貼圖 檔案 照片 圖片等內容
                    const nameSMatch = item.match(chatNameMatch)[0];
                    const personChatInfo = item.replace(nameSMatch, '');
                    if (personChatInfo.match(chatUrl) === null) {
                        if (!personChat.hasOwnProperty(name)) {
                            personChat[name] = [];
                        } else {
                            personChat[name].push(personChatInfo);
                        }
                    }
                }
            }
        });
    });
    // 對話種類次數
    Object.keys(memberChatCount).map((username)=>{
        const chatTotal = Object.values(memberChatCount[username]).reduce((a,b)=>a+b);
        memberChatCount[username][textLang] = memberChatCount[username][totalLang] - (chatTotal - memberChatCount[username][totalLang]);
    })

    // console.log(memberChatCount);
    // 對話分析結果
    allData.chatData = allChatData; // 所有對話資料
    allData.count = memberChatCount; // 所有人對話總計
    allData.dayCount = Object.keys(allData.chatData).length; // 總共對話了幾天
    allData.personChat = personChat; // 每個人的對話內容

    let chat_count = '';
    Object.keys(allData.count).forEach((elem, index) => {
        if (index !== allData.count.length) {
            chat_count += `${elem} : ${allData.count[elem][totalLang]}\r\n`
        } else {
            chat_count += `${elem} : ${allData.count[elem][totalLang]}`;
        }
    });
    // 分析字詞出現次數

    // 文字版
    // 對話次數
    // document.getElementById('chat_count').style.display = 'inline';
    // document.getElementById('chat_count').textContent += chat_count;
    // 總對話天數
    // document.getElementById('day_count').style.display = 'inline';
    // document.getElementById('day_count').textContent += JSON.stringify(allData.dayCount);
    // 時段頻率
    // document.getElementById('time_tag').style.display = 'inline';
    // document.getElementById('time_tag').textContent += JSON.stringify(allData.time).replace(/[{}]/g, '');
    pageData = allData;

    // 圖表版
    // 時段頻率
    document.getElementById('line_chart').style.visibility = 'visible';
    createRateOfDay(pageData);
    // 總對話數
    document.getElementById('bar_chart').style.visibility = 'visible';
    createChatCount(pageData);
    // 對話內容分析
    document.getElementById('doughnut_chart').style.visibility = 'visible';
    createChatType(pageData);
    // 字詞分析內容
    chatFreq(allData.personChat);

    loadingImage.style.visibility = "hidden";

}

/**
 * 分析字詞次數
 * @param personChat
 */
function chatFreq(personChat) {
    let chooseRadio = '';
    const wordAnalysis = {};
    Object.keys(personChat).forEach((username)=>{
        if(personChat[username].length > 0){
            const userRecord = personChat[username].reduce((a, b)=>{
                return a.toString() + '\n' + b.toString()
            })
            wordAnalysis[username] = WordFreqSync().process(userRecord)
        }
    })
    //建立選擇器
    Object.keys(wordAnalysis).forEach((username, index)=>{
        let chatRank = '';
        if(index === 0){
            chooseRadio += `<input type="radio" value="${username}" name="textCountChoose" onclick="textCountChoose(${index})" checked>${username}`
        }else{
            chooseRadio += `<input type="radio" value="${username}" name="textCountChoose" onclick="textCountChoose(${index})">${username}`
        }
        for (let i = 0; i < 15; i++) {
            if(i >= wordAnalysis[username].length){
                break;
            }
            if(i === 0){
                chatRank += `${username}常用字詞排行榜</br>`
            }
            //建立資料
            chatRank += `${i + 1}名: <b>${wordAnalysis[username][i][0]}</b>  次數：<b>${wordAnalysis[username][i][1]}</b> <br>`
        }
        textCount.push(chatRank)
    })
    textCountDiv.style.visibility = 'visible';
    textCountCBlock.innerHTML = chooseRadio;
    textCountRank.innerHTML = textCount[0];
}

/**
 * 對話次數與時間 （頻率表）
 * @param data
 */
function createRateOfDay(data) {
    let delayed;
    const lineDatasetsArrays = [];
    const colors = colorSet(Object.keys(data.time).length);
    console.log(colors)
    Object.keys(data.time).map((elem, index) => {
        if (elem === totalLang) {
            return;
        }
        lineDatasetsArrays.push({
            label: elem,
            data: Object.values(data.time[elem]),
            backgroundColor: colors.backgroundColor[index-1],
            borderColor: colors.borderColor[index-1],
            borderWidth: 1
        })
    })
    const chartLineConfig = {
        type: 'line',
        data: {
            labels: [
                '00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
            ],
            datasets: lineDatasetsArrays,
        },
        options: {
            plugins: {
                title: {
                    display: true,
                    text: '對話時間（活動頻率)'
                },
            },
            responsive: true,
            animation: {
                onComplete: () => {
                    delayed = true;
                },
                delay: (context) => {
                    let delay = 0;
                    if (context.type === 'data' && context.mode === 'default' && !delayed) {
                        delay = context.dataIndex * 100 + context.datasetIndex * 100;
                    }
                    return delay;
                },
            },
        }
    };
    lineChart = new Chart(ctxLine, chartLineConfig);
}

/**
 *  總對話次數
 */
function createChatCount(data) {
    let delayed;
    let barDelayed = true
    const barDatasetsArrays = [];
    const countColors = colorSet(Object.keys(data.count).length);
    Object.keys(data.count).forEach((elem, index) => {
        const countData = {};
        countData[elem] = data.count[elem][totalLang];
        barDatasetsArrays.push({
            label: [elem],
            data: countData,
            borderColor: countColors.borderColor[index],
            backgroundColor: countColors.backgroundColor[index],
            borderWidth: 1
        })
    });
    const chartBarConfig = {
        type: 'bar',
        data: {
            labels: Object.keys(data.count),
            datasets: barDatasetsArrays,
        },
        options: {
            animation: {
                onComplete: () => {
                    barDelayed = true;
                },
                delay: (context) => {
                    let delay = 0;
                    if (context.type === 'data' && context.mode === 'default' && !delayed) {
                        delay = context.dataIndex * 100 + context.datasetIndex * 100;
                    }
                    return delay;
                },
            },
            plugins: {
                title: {
                    display: true,
                    text: '對話次數'
                },
            },
            responsive: true,
            scales: {
                x: {
                    stacked: true,
                }
            }
        }
    }
    barChart = new Chart(ctxBar, chartBarConfig);
}

/**
 * 對話種類分析
 * @param data
 */
function createChatType(data) {
    // 對象對話內容分析
    // labels - 顏色標籤 - doughnutLabelData
    const radioUser = []; // 選擇用
    Object.keys(data.count).forEach((username) => {
        radioUser.push(username);
        console.log(JSON.stringify(data.count[username]))
        const userData = JSON.parse(JSON.stringify(data.count[username]));
        delete userData[totalLang];
        doughnutLabelData.push(userData);
        doughnutInfoData.push({
            // labels : Object.keys(allData.count[username]),
            data: Object.values(userData),
            backgroundColor: colorSet(Object.keys(userData).length).backgroundColor
        })
    });

    const chartPolarConfig = {
        type: 'pie',
        data: {
            labels: Object.keys(doughnutLabelData[0]),
            datasets: [doughnutInfoData[0]],
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: '個人訊息種類分析'
                }
            }
        },
    };
    doughnutChart = new Chart(ctxDoughnut, chartPolarConfig);

    let innerRadio = '';
    radioUser.forEach((elem, index) => {
        if (index === 0) {
            innerRadio += `<input type="radio" value="${elem}" name="chooseChatType" onClick="chooseDoughnut(${index})" checked/>${elem} `
        } else {
            innerRadio += `<input type="radio" value="${elem}" name="chooseChatType" onClick="chooseDoughnut(${index})"/>${elem} `
        }
    })
    doughnutBlock.innerHTML = innerRadio
}

/**
 * 常用字詞排行榜選擇
 * @param number
 */
function textCountChoose(number){
    textCountRank.innerHTML = textCount[number];
}

/**
 * 根據選擇對象 改變圓餅圖的內容
 * @param number
 */
function chooseDoughnut(number) {
    doughnutChart.data.labels.pop();
    doughnutChart.data.datasets.pop();
    doughnutChart.data.labels = Object.keys(doughnutLabelData[number]);
    doughnutChart.data.datasets.push(doughnutInfoData[number]);
    doughnutChart.update();
}

/**
 * 顏色列表 (官方sample顏色)
 * @param count
 * @return {}
 */
function colorSet(count) {
    const returnObject = {};
    returnObject.backgroundColor = [];
    returnObject.borderColor = [];
    const backgroundColor = ['rgba(255, 99, 132, 0.2)', 'rgba(255, 159, 64, 0.2)', 'rgba(255, 205, 86, 0.2)', 'rgba(75, 192, 192, 0.2)', 'rgba(54, 162, 235, 0.2)', 'rgba(153, 102, 255, 0.2)', 'rgba(201, 203, 207, 0.2)'];
    const borderColor = ['rgb(255, 99, 132)', 'rgb(255, 159, 64)', 'rgb(255, 205, 86)', 'rgb(75, 192, 192)', 'rgb(54, 162, 235)', 'rgb(153, 102, 255)', 'rgb(201, 203, 207)'];
    for (let i = 0; i < count; i++) {
        let ring;
        ring = Math.floor(i / backgroundColor.length);
        if (i > backgroundColor.length - 1) {
            returnObject.borderColor.push(borderColor[i - borderColor.length * ring]);
            returnObject.backgroundColor.push(backgroundColor[i - backgroundColor.length * ring]);
        } else {
            returnObject.borderColor.push(borderColor[i])
            returnObject.backgroundColor.push(backgroundColor[i])
        }
    }
    return returnObject;
}

