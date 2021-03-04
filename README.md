# publish-webpack-plugin

### my first webpack-plugin
### aliyun.yaml 配置
```yaml
ak: xxx
sk: xxx

account1:
  ak: xxx
  sk: xxx
account2:
  ak: xxx
  sk: xxx

```

### 使用
```js
new PublishWebpackPlugin({
    publicPath: '/test',
    bucket: 'XXX',
    region: 'XXX', // bucket所在区域的接入点
    exclude: function (asset) {
        return /\.html$/.test(asset);
    }
})
```
