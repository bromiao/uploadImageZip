import { hot } from 'react-hot-loader/root'
import FileUploader from './components/FileUploader'
import styles from './index.module.less'
const app = () => {
  return (
    <div className={styles.app}>
      <div className={styles.content}>
        <FileUploader />
      </div>
    </div>
  )
}
export default hot(app)
