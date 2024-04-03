import React, { useState, useRef, useEffect } from 'react';
import { Upload, Button, InputNumber, Row, Col, Input, Slider } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { saveAs } from 'file-saver';

import './index.less';

const API = 'http://10.1.140.227:8555';

const FileUploader = () => {
  const fileName = useRef<any>();
  const [inputValue, setInputValue] = useState(50);

//页面初始化删除上传文件夹和压缩文件夹
  useEffect(() => {
    fetch(`${API}/deleteFolder`);
  }, []);

  const batchDownload = () => {
    fetch(`${API}/downloadAll?quality=${inputValue.toString()}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.blob();
      })
      .then((blob) => {
        saveAs(blob, '批量下载.zip');
      })
      .catch((error) => {
        console.error('There was a problem with the fetch operation:', error);
      });
  };

  const onDownload = (file: any) => {
    const formData = new FormData();
    formData.append('file', file.originFileObj);
    formData.append('quality', inputValue.toString());
    fetch(`${API}/download`, {
      method: 'POST',
      body: formData
    })
      .then((response: any) => {
        fileName.current = decodeURIComponent(
          response.headers.get('content-disposition').split('=')[1]
        );

        return response.blob();
      })
      .then((data) => saveAs(data, fileName.current))
      .catch((error) => console.error(error));
  };

  const formatter = (value: number) => `${value}%`;
  const onChange = (newValue: number) => {
    setInputValue(newValue);
  };

  return (
    <div className="file-box">
      <div className="upload-list-inline">
        <Row >
          <Col span={16}>
          图片质量:
          <Slider
            tooltip={{ formatter }}
            onChange={onChange}
            value={typeof inputValue === 'number' ? inputValue : 0}
          />
          </Col>
          <Col>
          <InputNumber
          min={1}
          max={100}
          style={{ margin: '0 16px' }}
          value={inputValue}
          onChange={onChange}
        />
          </Col>
         
        </Row>
        <Upload
          action={`${API}/upload`}
          listType="picture"
          showUploadList={{
            showDownloadIcon: true,
            downloadIcon: '下载',
            showRemoveIcon: false
          }}
          multiple
          onDownload={onDownload}
        >
          <Button icon={<UploadOutlined />}>点击上传图片</Button>
        </Upload>
      </div>
      <Button icon={<UploadOutlined />} onClick={batchDownload}>
        批量下载压缩文件
      </Button>
    </div>
  );
};
export default FileUploader;
