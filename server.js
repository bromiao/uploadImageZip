const express = require('express');
const fileUpload = require('express-fileupload');
const path = require('path');
const cors = require('cors'); // 导入 cors 模块
const fs = require('fs');
const archiver = require('archiver');
const bodyParser = require('body-parser');
const sharp = require('sharp');
const app = express();

const outputDirectory = './components/UploadsZip';
const inputDirectory = './components/Uploads';

// 使用 express-fileupload 中间件处理文件上传
app.use(
  fileUpload({
    createParentPath: true,
    defParamCharset: 'utf8' // 添加utf8编码
  })
);

//防止跨域
app.use(cors());

// 使用 body-parser 中间件来解析请求体中的数据
app.use(bodyParser.json());

//处理点击上传
app.post('/upload', (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }
  const uploadedFile = req.files.file; // "file" 是 Ant Design Upload 组件默认的文件字段名
  const fileName = uploadedFile.name;
  // 确保目标文件夹存在，如果不存在则创建它
  if (!fs.existsSync(inputDirectory)) {
    fs.mkdirSync(inputDirectory, { recursive: true });
  }

  // 构建目标文件的完整路径
  const targetFilePath = path.join(inputDirectory, fileName);

  // 将上传的文件保存到目标文件夹
  uploadedFile.mv(targetFilePath, (err) => {
    if (err) {
      return res.status(500).send('Error saving file.');
    }
    res.send('上传成功');
  });
});

//单个点击下载
app.post('/download', (req, res) => {
  const uploadedFile = req.files.file; // "file" 是 Ant Design Upload 组件默认的文件字段名
  const qualityNumber = Number(req.body.quality);
  const encodedFileName = encodeURIComponent(uploadedFile.name);
  // 使用Sharp进行压缩
  sharp(uploadedFile.data)
    .jpeg({ quality: qualityNumber }) // 设置JPEG压缩质量，范围是0-100
    .toBuffer((err, data) => {
      if (err) {
        return res.status(500).json({ error: '图像压缩时出错' });
      }
      // 将压缩后的图像数据发送回客户端
      res.writeHead(200, {
        'Content-Type': 'image/jpeg', // 适应您的图像类型
        'Access-Control-Expose-Headers': 'Content-Disposition',
        'Content-Disposition': `attachment;filename=${encodedFileName}`
      });
      res.end(data);
    });
});

// 处理按钮点击的路由,请求完成后将内容压缩成zip包返回到客户端，进行批量下载
app.get('/downloadAll', async (req, res) => {
  const qualityNumber = Number(req.query.quality);
  res.writeHead(200, {
    'Content-Type': 'application/zip',
    'Access-Control-Expose-Headers': 'Content-Disposition',
    'Content-Disposition': `attachment; filename=${encodeURIComponent('批量下载.zip')}`
  });
  await batchingChange(qualityNumber);
  await archiveChange(res);
});



//页面初始化删除上传文件夹和压缩文件夹
app.get('/deleteFolder', (req, res) => {
  try {
    // 使用Node.js的fs模块删除文件夹及其内容
    if (fs.existsSync(outputDirectory) || fs.existsSync(inputDirectory)) {
      fs.rmdirSync(outputDirectory, { recursive: true });
      fs.rmdirSync(inputDirectory, { recursive: true });
      res.sendStatus(200);
    } else {
      res.sendStatus(404);
    }
  } catch (err) {
    console.error(`Error deleting folder: ${err}`);
    res.sendStatus(200);
  }
});


//响应接受数据，并执行压缩
const archiveChange = async (res) => {
  const archive = archiver('zip', {
    zlib: { level: 9 } // 压缩级别，可以根据需要调整
  });
  // 将响应流连接到 archiver，将压缩内容发送到客户端
  archive.pipe(res);

  // 添加文件夹内容到压缩包
  archive.directory(outputDirectory, false);
  archive.on('error', function (err) {
    log.trace('error' + err);
  });
  // 结束 archiver 进程并将响应结束
  await archive.finalize();
};

// 批量进行图片质量压缩
const batchingChange = (qualityNumber) => {
  // 创建输出目录，如果不存在的话
  if (!fs.existsSync(outputDirectory)) {
    fs.mkdirSync(outputDirectory);
  }
  // 创建输入目录，如果不存在的话
  if (!fs.existsSync(inputDirectory)) {
    fs.mkdirSync(inputDirectory);
  }

  return new Promise((resolve, reject) => {
    fs.readdir(inputDirectory, (err, files) => {
      if (err) {
        reject(err);
        return;
      }
      const promises = files.map((file) => {
        return new Promise((resolveFile, rejectFile) => {
          // 检查文件扩展名，仅处理图像文件
          if (['.jpg', '.jpeg', '.png'].includes(path.extname(file).toLowerCase())) {
            const inputPath = path.join(inputDirectory, file);
            const outputPath = path.join(outputDirectory, file);
            // 复制图片而不进行任何调整
            sharp(inputPath)
              .jpeg({ quality: qualityNumber }) // 设置JPEG压缩质量，范围是0-100
              .toFile(outputPath, (err, info) => {
                if (err) {
                  rejectFile(err);
                } else {
                  resolveFile();
                }
              });
          } else {
            resolveFile();
          }
        });
      });
      // 使用 Promise.all 来等待所有文件处理完成
      Promise.all(promises)
        .then(() => {
          resolve();
        })
        .catch((error) => {
          reject(error);
        });
    });
  });
};

const port = 8555;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
