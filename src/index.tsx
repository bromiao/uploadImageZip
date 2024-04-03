import styles from './index.module.less';
import Nav from './components/layout/Nav/index';
import TitleBar from './components/layout/TitleBar/index';
import FileUploader from './components/FileUploader';
import { hot } from 'react-hot-loader/root';
const app = () => {
  return (
    <div className={styles.app}>
      <div className={styles.content}>
        <FileUploader />
      </div>
    </div>
  );
};
export default hot(app);
