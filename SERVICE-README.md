# Systemd 服务安装说明

## 安装步骤

1. **确保项目已构建**
   ```bash
   cd /home/zb/cat-rescue
   npm run build
   ```

2. **安装服务**
   ```bash
   sudo ./install-service.sh
   ```

3. **启动服务**
   ```bash
   sudo systemctl start cat-rescue
   ```

4. **检查服务状态**
   ```bash
   sudo systemctl status cat-rescue
   ```

## 常用命令

### 服务管理
- **启动服务**: `sudo systemctl start cat-rescue`
- **停止服务**: `sudo systemctl stop cat-rescue`
- **重启服务**: `sudo systemctl restart cat-rescue`
- **查看状态**: `sudo systemctl status cat-rescue`
- **启用开机自启**: `sudo systemctl enable cat-rescue`
- **禁用开机自启**: `sudo systemctl disable cat-rescue`

### 日志查看
- **查看实时日志**: `sudo journalctl -u cat-rescue -f`
- **查看最近日志**: `sudo journalctl -u cat-rescue -n 100`
- **查看今天的日志**: `sudo journalctl -u cat-rescue --since today`

## 配置说明

服务文件位置: `/etc/systemd/system/cat-rescue.service`

如果需要修改配置（如端口、环境变量等），可以编辑服务文件后执行：
```bash
sudo systemctl daemon-reload
sudo systemctl restart cat-rescue
```

## 环境变量

如果需要设置环境变量（如数据库连接等），可以在服务文件中添加：
```
Environment="DB_HOST=localhost"
Environment="DB_PORT=5432"
Environment="DB_NAME=cat_rescue"
Environment="DB_USER=postgres"
Environment="DB_PASSWORD=your_password"
```

或者创建 `.env` 文件在项目根目录。

## 故障排查

如果服务无法启动，可以：
1. 查看日志: `sudo journalctl -u cat-rescue -n 50`
2. 检查端口是否被占用: `sudo netstat -tlnp | grep 3000`
3. 检查文件权限: `ls -la /home/zb/cat-rescue/.output/server/index.mjs`
4. 手动测试启动: `cd /home/zb/cat-rescue && node .output/server/index.mjs`

