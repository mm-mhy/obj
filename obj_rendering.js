// 初始化基础Three.js场景
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

// 设置渲染器
renderer.setSize(800, 600);
renderer.domElement.style.borderRadius = '20px';
renderer.setClearColor(0x101010);
// document.body.appendChild(renderer.domElement);
document.getElementById('render_window').appendChild(renderer.domElement);

// 添加光源
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);
const gridHelper = new THREE.GridHelper(20, 20,0x444444, 0x606060);
scene.add(gridHelper);

// 设置相机位置和轨道控制器
camera.position.set(20, 10, 20);
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

document.getElementById('mp4_file_uploader').addEventListener('click', function() {
    document.getElementById('mp4_file_input').click();
});
document.getElementById('mp4_file_input').addEventListener('change', async function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const layImg = document.getElementById('lay_img');
    let filename = document.getElementById('file-name');
    let video; // 在此处声明变量
    layImg.classList.add('loading');
    try {
        video = document.createElement('video'); // 在此处赋值
        video.src = URL.createObjectURL(file);
        video.muted = true;

        await new Promise((resolve, reject) => {
            video.onloadedmetadata = resolve;
            video.onerror = reject;
        });
        video.currentTime = 0.1;
        await new Promise(resolve => video.onseeked = resolve);
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);  
        layImg.style.backgroundImage = `url(${canvas.toDataURL()})`;
        filename.innerHTML = file.name;
    } catch (error) {
        layImg.style.backgroundImage = 'url(img/image_1.png)';
        alert('视频处理失败: ' + error.message);
    } finally {
        layImg.classList.remove('loading');
        if (video && video.src) { // 安全访问
            URL.revokeObjectURL(video.src);
        }
    }
});

document.getElementById('file-uploader').addEventListener('click', function() {
    document.getElementById('file-input').click();
});
// 处理文件上传
document.getElementById('file-input').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    // 清除旧模型
    scene.traverse(child => {
        if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            scene.remove(child);
        }
    });

    // 加载OBJ文件
    const loader = new THREE.OBJLoader();
    const reader = new FileReader();

    reader.onload = function(event) {
        const objData = event.target.result;
        
        try {
            const object = loader.parse(objData);
            
            // 自动缩放模型
            const bbox = new THREE.Box3().setFromObject(object);
            const center = bbox.getCenter(new THREE.Vector3());
            const size = bbox.getSize(new THREE.Vector3());
            
            // 调整位置和比例
            object.position.sub(center);
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 5 / maxDim;
            object.scale.set(scale, scale, scale);

            // 应用默认材质
            object.traverse(child => {
                if (child.isMesh) {
                    child.material = new THREE.MeshPhongMaterial({
                        color: 0x2194ce,
                        shininess: 100
                    });
                }
            });

            scene.add(object);
        } catch (error) {
            console.error('Error loading OBJ:', error);
            alert('无法加载OBJ文件，请检查文件格式');
        }
    };

    reader.readAsText(file);
});

// 窗口大小调整处理
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// 动画循环
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();