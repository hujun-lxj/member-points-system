// Supabase配置 - 已配置您的信息
const supabaseUrl = 'https://qctnrfuynjyhksaleqkj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjdG5yZnV5bmp5aGtzYWxlcWtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxNzQ2NzEsImV4cCI6MjA3ODc1MDY3MX0.Xp5ZVScsOeIUTXwvFyctJQDl2oLLbFw3_VKFRkjg3Vo';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 从URL参数获取用户ID
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('userid');
    
    if (userId) {
        // 如果有用户ID参数，直接加载数据
        loadUserData(userId);
    } else {
        // 没有用户ID，显示输入界面
        showInputInterface();
    }
});

// 显示用户ID输入界面
function showInputInterface() {
    const content = `
        <div class="input-section">
            <h2>会员积分查询</h2>
            <input type="text" class="user-id-input" id="userIdInput" placeholder="请输入您的用户ID">
            <br>
            <button class="submit-btn" onclick="submitUserId()">查询积分</button>
            <div style="margin-top: 30px; color: #666; font-size: 14px;">
                <p>请联系管理员获取您的用户ID</p>
            </div>
        </div>
    `;
    
    document.getElementById('content').innerHTML = content;
    document.getElementById('loading').style.display = 'none';
    document.getElementById('content').style.display = 'block';
}

// 提交用户ID
function submitUserId() {
    const userId = document.getElementById('userIdInput').value.trim();
    if (userId) {
        // 重新加载页面并带上用户ID参数
        window.location.href = `?userid=${encodeURIComponent(userId)}`;
    } else {
        alert('请输入用户ID');
    }
}

// 加载用户数据
async function loadUserData(userId) {
    try {
        showLoading('加载用户信息...');
        
        // 查询用户积分数据
        const { data: userData, error } = await supabase
            .from('points_account')
            .select('*')
            .eq('user_id', userId)
            .single();
            
        if (error) {
            if (error.code === 'PGRST116') {
                showError('用户不存在', '请检查用户ID是否正确，或联系管理员');
                return;
            }
            throw error;
        }
        
        if (!userData) {
            showError('用户不存在', '请检查用户ID是否正确');
            return;
        }
        
        // 显示用户数据
        displayUserData(userData);
        
        // 加载积分记录
        await loadUserRecords(userId);
        
    } catch (error) {
        console.error('加载用户数据失败:', error);
        showError('系统错误', '请稍后重试或联系管理员');
    }
}

// 显示用户数据
function displayUserData(userData) {
    // 计算释放进度
    const released = userData.withdrawable || 0;
    const totalRelease = userData.total_points * 0.003;
    const progress = totalRelease > 0 ? Math.min((released / totalRelease) * 100, 100) : 0;
    
    const content = `
        <div class="weui-tab">
            <div class="weui-tab__panel">
                <!-- 用户信息 -->
                <div class="user-card">
                    <div class="weui-panel__hd">我的积分</div>
                    <div class="weui-panel__bd">
                        <div class="weui-media-box weui-media-box_appmsg">
                            <div class="weui-media-box__hd">
                                <span style="font-size:40px;">👤</span>
                            </div>
                            <div class="weui-media-box__bd">
                                <h4 class="weui-media-box__title">${userData.user_name || '会员'}</h4>
                                <p class="weui-media-box__desc">ID: ${userData.user_id}</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 积分数据 -->
                <div class="points-data">
                    <div class="point-item">
                        <span class="point-value">${formatNumber(userData.total_points)}</span>
                        <span class="point-label">总积分</span>
                    </div>
                    <div class="point-item">
                        <span class="point-value">${formatNumber(userData.withdrawable || 0)}</span>
                        <span class="point-label">可提现</span>
                    </div>
                    <div class="point-item">
                        <span class="point-value">V${userData.level || 0}</span>
                        <span class="point-label">会员等级</span>
                    </div>
                </div>
                
                <!-- 释放进度 -->
                <div class="progress-section">
                    <div class="weui-panel__hd">释放进度</div>
                    <div class="weui-panel__bd">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                        <div style="text-align: center; margin-top: 10px;">
                            <span style="font-size: 16px; font-weight: bold;">${Math.round(progress)}%</span>
                            <div style="font-size: 12px; color: #666; margin-top: 5px;">
                                已释放: ${formatNumber(released)} / ${formatNumber(totalRelease)}
                            </div>
                            <div style="font-size: 12px; color: #999; margin-top: 3px;">
                                每日释放总积分的0.3%
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 积分记录 -->
                <div class="records-section">
                    <div class="weui-panel__hd">最近记录</div>
                    <div class="weui-panel__bd" id="recordsList">
                        <div class="weui-loadmore">
                            <i class="weui-loading"></i>
                            <span class="weui-loadmore__tips">加载记录中</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('content').innerHTML = content;
    document.getElementById('loading').style.display = 'none';
    document.getElementById('content').style.display = 'block';
}

// 加载用户记录
async function loadUserRecords(userId) {
    try {
        const { data: records, error } = await supabase
            .from('points_log')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(10);
            
        if (error) throw error;
        
        updateRecordsList(records);
        
    } catch (error) {
        console.error('加载记录失败:', error);
        document.getElementById('recordsList').innerHTML = 
            '<div class="weui-loadmore weui-loadmore_line"><span class="weui-loadmore__tips">加载记录失败</span></div>';
    }
}

// 更新记录列表
function updateRecordsList(records) {
    const recordsList = document.getElementById('recordsList');
    
    if (!records || records.length === 0) {
        recordsList.innerHTML = '<div class="weui-loadmore weui-loadmore_line"><span class="weui-loadmore__tips">暂无记录</span></div>';
        return;
    }
    
    let html = '';
    records.forEach(record => {
        const amountClass = record.amount >= 0 ? 'positive' : 'negative';
        const typeText = getRecordTypeText(record.type);
        const timeText = formatTime(record.created_at);
        
        html += `
            <div class="record-item">
                <div class="record-info">
                    <div class="record-type">${typeText}</div>
                    <div class="record-time">${timeText} - ${record.remark || ''}</div>
                </div>
                <div class="record-amount ${amountClass}">
                    ${record.amount >= 0 ? '+' : ''}${formatNumber(record.amount)}
                </div>
            </div>
        `;
    });
    
    recordsList.innerHTML = html;
}

// 显示错误信息
function showError(title, message) {
    const content = `
        <div class="error-message">
            <h2>${title}</h2>
            <p>${message}</p>
            <button class="submit-btn" onclick="showInputInterface()" style="margin-top: 20px;">重新输入</button>
        </div>
    `;
    
    document.getElementById('content').innerHTML = content;
    document.getElementById('loading').style.display = 'none';
    document.getElementById('content').style.display = 'block';
}

// 显示加载状态
function showLoading(message) {
    document.getElementById('loading').innerHTML = `
        <div class="weui-loadmore">
            <i class="weui-loading"></i>
            <span class="weui-loadmore__tips">${message}</span>
        </div>
    `;
}

// 工具函数：格式化数字
function formatNumber(num) {
    return Number(num).toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// 工具函数：格式化时间
function formatTime(timestamp) {
    const date = new Date(timestamp);
    return `${date.getMonth()+1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
}

// 工具函数：获取记录类型文本
function getRecordTypeText(type) {
    const types = {
        1: '奖励',
        2: '释放', 
        3: '提现',
        4: '其他'
    };
    return types[type] || '交易';
}