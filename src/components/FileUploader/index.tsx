import { UploadOutlined } from '@ant-design/icons'
import { Button, Col, InputNumber, Row, Slider, Upload } from 'antd'
import { saveAs } from 'file-saver'
import { useEffect, useRef, useState } from 'react'
import { getLocalIP } from 'utils/getLocalIP'
import './index.less'

const FileUploader = () => {
  const fileName = useRef<any>()
  const apiRef = useRef('http://192.168.31.179:8555')
  const [inputValue, setInputValue] = useState(50)

  //页面初始化删除上传文件夹和压缩文件夹
  useEffect(() => {
    const setApi = async () => {
      const localIP = await getLocalIP()
      apiRef.current = `http://${localIP}:8555`
    }
    setApi()
    fetch(`${apiRef.current}/deleteFolder`)
  }, [])

  const batchDownload = () => {
    fetch(`${apiRef.current}/downloadAll?quality=${inputValue.toString()}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok')
        }
        return response.blob()
      })
      .then(blob => {
        saveAs(blob, '批量下载.zip')
      })
      .catch(error => {
        console.error('There was a problem with the fetch operation:', error)
      })
  }

  const onDownload = (file: any) => {
    const formData = new FormData()
    formData.append('file', file.originFileObj)
    formData.append('quality', inputValue.toString())
    fetch(`${apiRef.current}/download`, {
      method: 'POST',
      body: formData
    })
      .then((response: any) => {
        fileName.current = decodeURIComponent(
          response.headers.get('content-disposition').split('=')[1]
        )

        return response.blob()
      })
      .then(data => saveAs(data, fileName.current))
      .catch(error => console.error(error))
  }

  const formatter = (value: number) => `${value}%`
  const onChange = (newValue: number) => {
    setInputValue(newValue)
  }

  return (
    <div className='file-box'>
      <div className='upload-list-inline'>
        <Row>
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
          action={`${apiRef.current}/upload`}
          listType='picture'
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
      <Button
        icon={<UploadOutlined />}
        onClick={batchDownload}
      >
        批量下载压缩文件
      </Button>
    </div>
  )
}
export default FileUploader
