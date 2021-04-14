let analysisAll;
const uploadData = document.querySelector('#uploadLineChat')
uploadData.addEventListener('change', formatLine);
const ctx = document.getElementById('myChart');

async function formatLine(e) {
    uploadData.style.display = 'none';
    const fileInfo = e.target.files[0]
    const file = await fileInfo.text();
    let dayMatch;
    const dayMatch_zh_tw = /(2[0-1][0-9][0-9])\/(0[1-9]|1[0-2])\/((0[1-9]|[12]\d|3[01])|([1-9]|[12]\d|3[01]))（(週[一二三四五六日]|[一|二三四五六日])）/g; // 中文
    const dayMatch_en = /(Sun|Mon|Tue|Wed|Thu|Fri|Sat), ((0[1-9]|[12]\d|3[01])|([1-9]|[12]\d|3[01]))\/(0[1-9]|1[0-2])\/((2)[0-1][0-9][0-9])/g // 英文
    // 聊天標籤
    const chatMatch = /^(0[0-9]|1[0-9]|2[0-3]):(([012345])[0-9])\t/g; // 若為聊天格式
    // 名字標籤
    const nameMatch = /\t.*?\t/g;
    // 特殊狀態
    const systemMatch = /(0[0-9]|1[0-9]|2[0-3]):(([012345])[0-9])\t.*?\t\[(檔案|照片|貼圖|禮物|影片|Video|File|Photo|Sticker)]/g // 對話內容若為傳送圖片等
    const onlySMatch = /\[(檔案|照片|貼圖|禮物|影片|Video|File|Photo|Sticker)]/g

    // 取得第一行資訊 確認第一行是中文還是英文
    const firstLine = file.split(/\n/)[0]
    switch (true) {
        case firstLine.indexOf('Chat history') > -1:
            dayMatch = dayMatch_en;
            break;
        case firstLine.indexOf('聊天記錄') > -1:
            dayMatch = dayMatch_zh_tw;
            break;
        default: // 預設中文
            dayMatch = dayMatch_zh_tw;
            break
    }
    // 儲存物件
    const allData = {};
    const timeTag = {'0':0, '1':0, '2':0, '3':0, '4':0, '5':0, '6':0, '7':0, '8':0, '9':0, '10':0, '11':0, '12':0, '13':0, '14':0, '15':0, '16':0, '17':0, '18':0, '19':0, '20':0, '21':0, '22':0, '23':0}
    const allChatData = {};
    const member = {};
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

    // 計算資料總和 foreach
    Object.keys(allChatData).map((elem, index) => {
        allChatData[elem].map((item) => {
            if (item.match(nameMatch) !== null) {
                // 計算發話總和
                const name = item.match(nameMatch)[0].replace(/\t/g, '');
                if (member.hasOwnProperty(name)) {
                    member[name]++;
                } else {
                    member[name] = 1
                }
                // 計算傳送資訊 (貼圖/相片/)
            }
            if (item.match(chatMatch) !== null) {
                const tempHour = item.match(chatMatch)[0].split(':')[0];
                let hourKey = tempHour.length === 2 && tempHour.indexOf('0') === 0 ? tempHour.replace('0', '') : tempHour; // 將0去掉
                timeTag[hourKey]++;
            }
        });
    });
    // 對話分析結果
    allData.chatData = allChatData;
    allData.count = member
    allData.dayCount = Object.keys(allData.chatData).length;
    allData.time = timeTag;
    analysisAll = allData;

    let chat_count = '';
    Object.keys(allData.count).forEach((elem, index)=>{
        if(index !== allData.count.length){
            chat_count += `${elem} : ${allData.count[elem]}\r\n`
        }else {
            chat_count += `${elem} : ${allData.count[elem]}`;
        }
    });

    // 對話次數
    document.getElementById('chat_count').style.display = 'inline';
    document.getElementById('chat_count').textContent += chat_count;
    // 總對話天數
    document.getElementById('day_count').style.display = 'inline';
    document.getElementById('day_count').textContent += JSON.stringify(allData.dayCount);
    // 時段頻率 文字版
    // document.getElementById('time_tag').style.display = 'inline';
    // document.getElementById('time_tag').textContent += JSON.stringify(allData.time).replace(/[{}]/g, '');
    // 時段頻率
    document.getElementById('line_chart').style.visibility = 'visible';
    // const LineConfig = {
    //     type: 'line',
    //     // labels:['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23'],
    //     datasets: [{
    //         label:['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23'],
    //         fill: false,
    //         data: Object.values(allData.time),
    //         // data: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
    //         borderColor: 'rgb(75, 192, 192)'
    //     }]
    // }

    // 總對話次數與時間 （頻率表）
    const chartConfig = {
        type: 'line',
        data: {
            labels: [
                '00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
            ],
            datasets: [{
                label: '總對話次數',
                backgroundColor: 'rgb(255, 99, 132)',
                borderColor: 'rgb(255, 99, 132)',
                data: Object.values(allData.time),
            }],
        },
    };
    new Chart(ctx, chartConfig)
}

function timeFormat() {
}
