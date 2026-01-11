#!/bin/bash

# 安装 systemd 服务脚本

SERVICE_NAME="cat-rescue"
SERVICE_FILE="cat-rescue.service"
SYSTEMD_PATH="/etc/systemd/system"

echo "正在安装 $SERVICE_NAME 服务..."

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then 
    echo "请使用 sudo 运行此脚本"
    exit 1
fi

# 复制服务文件
cp "$SERVICE_FILE" "$SYSTEMD_PATH/$SERVICE_FILE"

# 重新加载 systemd
systemctl daemon-reload

# 启用服务（开机自启）
systemctl enable $SERVICE_NAME

echo "服务安装完成！"
echo ""
echo "使用以下命令管理服务："
echo "  启动服务: sudo systemctl start $SERVICE_NAME"
echo "  停止服务: sudo systemctl stop $SERVICE_NAME"
echo "  重启服务: sudo systemctl restart $SERVICE_NAME"
echo "  查看状态: sudo systemctl status $SERVICE_NAME"
echo "  查看日志: sudo journalctl -u $SERVICE_NAME -f"
echo "  禁用自启: sudo systemctl disable $SERVICE_NAME"

