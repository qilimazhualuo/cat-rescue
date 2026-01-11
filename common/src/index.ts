import CryptoJS from 'crypto-js'

/**
 * 生成 UUID (通用唯一标识符)
 * @returns 返回符合 UUID v4 格式的字符串
 */
export const guid = (): string => {
    const S4 = (): string => {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)
    }
    return S4() + S4() + '-' + S4() + '-' + S4() + '-' + S4() + '-' + S4() + S4() + S4()
}

/**
 * 树形节点接口
 * 用于构建树形结构的数据节点
 */
interface TreeNode {
    /** 节点ID */
    id: string | number
    /** 父节点ID */
    pid: string | number
    /** 子节点数组 */
    children?: TreeNode[]
    /** 其他自定义属性 */
    [key: string]: any
}

/**
 * 将扁平数组转换为树形结构
 * @param list - 扁平化的节点数组
 * @returns 树形结构的节点数组
 */
export const treeDataMake = (list: TreeNode[]): TreeNode[] => {
    const aloneArr: TreeNode[] = []
    for (let i = 0; i < list.length; i++) {
        let isHave = false
        for (let j = 0; j < list.length; j++) {
            if (list[i].pid === list[j].id) {
                isHave = true
            }
        }
        if (!isHave) {
            aloneArr.push(list[i])
        }
    }

    /**
     * 递归构建树形结构
     * @param list - 扁平化的节点数组
     * @param top - 当前处理的节点
     * @returns 处理后的节点，包含子节点信息
     */
    const treeLoop = (list: TreeNode[], top: TreeNode): TreeNode => {
        top.children = []
        for (let i = 0; i < list.length; i++) {
            if (list[i].pid === top.id) {
                const obj = list[i]
                treeLoop(list, list[i])
                top.children.push(obj)
            }
        }
        if (top.children.length === 0) {
            delete top.children
        }
        return top
    }

    const arr: TreeNode[] = []
    aloneArr.forEach(item => arr.push(treeLoop(list, item)))
    return arr
}

/**
 * 前后台统一的盐值
 */
const KEY_STRING = '1234567890123456'

/**
 * 默认加密密钥
 */
const KEY = CryptoJS.enc.Utf8.parse(KEY_STRING)

/**
 * 默认初始化向量
 */
const IV = CryptoJS.enc.Utf8.parse(KEY_STRING)

/**
 * AES 加密函数
 * @param word - 待加密的明文字符串
 * @param keyStr - 可选的密钥字符串，如果不提供则使用默认 KEY
 * @param ivStr - 可选的初始化向量字符串，如果不提供则使用默认 IV
 * @returns 返回 Base64 编码的加密结果
 * @throws 当参数无效或加密过程出错时抛出错误
 */
export const encryptPass = (word: string, keyStr?: string, ivStr?: string): string => {
    // 参数验证
    if (!word) {
        throw new Error('待加密的内容不能为空')
    }

    if ((keyStr && !ivStr) || (!keyStr && ivStr)) {
        throw new Error('keyStr 和 ivStr 必须同时提供或同时为空')
    }

    // 使用默认值或解析提供的密钥和IV
    const key = keyStr ? CryptoJS.enc.Utf8.parse(keyStr) : KEY
    const iv = ivStr ? CryptoJS.enc.Utf8.parse(ivStr) : IV

    try {
        // 将明文转换为 UTF-8 编码
        const srcs = CryptoJS.enc.Utf8.parse(word)

        // 执行 AES 加密
        const encrypted = CryptoJS.AES.encrypt(srcs, key, {
            iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.ZeroPadding,
        })

        // 返回 Base64 编码的结果
        return CryptoJS.enc.Base64.stringify(encrypted.ciphertext)
    } catch (error: any) {
        throw new Error(`加密过程中发生错误: ${error.message}`)
    }
}

/**
 * AES 解密函数
 * @param word - 待解密的 Base64 编码字符串
 * @param keyStr - 可选的密钥字符串，如果不提供则使用默认 KEY
 * @param ivStr - 可选的初始化向量字符串，如果不提供则使用默认 IV
 * @returns 返回解密后的明文字符串
 * @throws 当参数无效或解密过程出错时抛出错误
 */
export const decryptPass = (word: string, keyStr?: string, ivStr?: string): string => {
    // 参数验证
    if (!word || typeof word !== 'string') {
        throw new Error('待解密的内容不能为空且必须为字符串')
    }

    if ((keyStr && !ivStr) || (!keyStr && ivStr)) {
        throw new Error('keyStr 和 ivStr 必须同时提供或同时为空')
    }

    // 使用默认值或解析提供的密钥和IV
    const key = keyStr ? CryptoJS.enc.Utf8.parse(keyStr) : KEY
    const iv = ivStr ? CryptoJS.enc.Utf8.parse(ivStr) : IV

    try {
        // 执行 AES 解密
        const decrypt = CryptoJS.AES.decrypt(word, key, {
            iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.ZeroPadding,
        })

        const decryptedStr = decrypt.toString(CryptoJS.enc.Utf8)

        // 验证解密结果
        if (!decryptedStr) {
            throw new Error('解密失败，可能是密钥错误或数据损坏')
        }

        return decryptedStr
    } catch (error: any) {
        throw new Error(`解密过程中发生错误: ${error.message}`)
    }
}

