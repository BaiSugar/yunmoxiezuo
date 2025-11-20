import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import axios from 'axios';
import { NovelSearchDto } from '../dto/novel-search.dto';
import { GetBookDetailDto } from '../dto/get-book-detail.dto';
import { SearchType } from '../enums/search-type.enum';

@Injectable()
export class NovelSearchService {
  private readonly logger = new Logger(NovelSearchService.name);
  
  // 硬编码的密钥
  private readonly HARDCODED_KAMI = '';

  /**
   * 执行短文搜索
   * 实现PHP proxy.php的相同逻辑：转发请求到远程API
   */
  async search(searchDto: NovelSearchDto, apiConfig: any) {
    const { searchType, query, platform } = searchDto;
    const remoteApiBaseUrl = apiConfig.apiBaseUrl || 'http://';
    
    try {
      this.logger.log(`搜索请求: 类型=${searchType}, 关键词=${query}, 平台=${platform}`);

      // 根据搜索类型选择对应的PHP文件
      let actionName = '';
      let postData: any = {
        kami: this.HARDCODED_KAMI, // 添加密钥
      };

      switch (searchType) {
        case SearchType.TITLE:
          actionName = 'search_name';
          postData.action = 'search_name';
          postData.book_name = query;
          postData.book_pingtai = platform || '';
          break;

        case SearchType.URL:
          actionName = 'get_urlinfo';
          postData.action = 'get_urlinfo';
          postData.book_url = query;
          break;

        case SearchType.CONTENT:
          actionName = 'search_content';
          postData.action = 'search_content';
          postData.book_content = query;
          break;

        case SearchType.KEYWORD:
          actionName = 'get_klinfo';
          postData.action = 'get_klinfo';
          postData.book_kl = query;
          break;

        default:
          throw new HttpException('不支持的搜索类型', HttpStatus.BAD_REQUEST);
      }

      // 构建远程API URL
      const remoteApiUrl = `${remoteApiBaseUrl}php/${actionName}.php`;
      
      this.logger.log(`转发请求到: ${remoteApiUrl}`);
      this.logger.log(`请求数据: ${JSON.stringify(postData)}`);
      this.logger.log(`超时设置: ${apiConfig.timeout || 30000}ms`);

      const startTime = Date.now();
      
      // 发送请求到远程API（使用表单编码，对应PHP的http_build_query）
      let response;
      try {
        response = await axios.post(remoteApiUrl, new URLSearchParams(postData).toString(), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: apiConfig.timeout || 30000,
          validateStatus: () => true, // 接受所有HTTP状态码
        });
        
        const duration = Date.now() - startTime;
        this.logger.log(`请求完成，耗时: ${duration}ms`);
      } catch (requestError) {
        const duration = Date.now() - startTime;
        this.logger.error(`请求失败，耗时: ${duration}ms`);
        
        if (requestError.code === 'ECONNABORTED') {
          this.logger.error('❌ 请求超时');
          throw new HttpException('搜索请求超时，请稍后再试', HttpStatus.REQUEST_TIMEOUT);
        } else if (requestError.code === 'ECONNREFUSED') {
          this.logger.error('❌ 连接被拒绝，远程API可能未启动');
          throw new HttpException('搜索服务暂时不可用', HttpStatus.SERVICE_UNAVAILABLE);
        } else if (requestError.code === 'ENOTFOUND') {
          this.logger.error('❌ 无法解析域名');
          throw new HttpException('搜索服务地址无效', HttpStatus.SERVICE_UNAVAILABLE);
        }
        throw requestError;
      }

      // 处理响应 - 支持多种返回格式
      const responseData = response.data;
      
      this.logger.log(`收到响应: status=${response.status}`);
      this.logger.log(`响应数据类型: ${typeof responseData}`);
      this.logger.log(`响应内容: ${JSON.stringify(responseData)?.substring(0, 500)}`); // 只打印前500字符
      
      if (!responseData) {
        this.logger.warn('响应数据为空');
        return {
          code: 'error',
          data: [],
          message: '搜索失败：无响应数据',
        };
      }

      // 处理不同的返回码
      const code = responseData.code;
      this.logger.log(`响应代码: ${code}`);
      
      // 成功的情况（直接返回文件名或URL）
      if (code === 'success' || code === 'video') {
        this.logger.log('✅ 匹配到 success/video 分支');
        const result = {
          code: 'success',
          data: [{ 
            type: code,
            url: responseData.data,
            message: responseData.message
          }],
          message: '搜索成功',
        };
        this.logger.log(`返回结果: ${JSON.stringify(result)}`);
        return result;
      }
      
      // 搜索列表结果（Internet_name, locality_name, yuewen_name等）
      if (code && (code.includes('_name') || responseData.list)) {
        this.logger.log('✅ 匹配到列表结果分支');
        const booksList = responseData.list || [];
        const platform = responseData.pingtai || '';
        
        this.logger.log(`书籍列表长度: ${booksList.length}`);
        
        // 统一格式化书籍列表
        const formattedBooks = booksList.map((book: any) => ({
          bookId: book.BookID || book.id,
          title: book.Title || book.name,
          author: book.Author || '未知',
          preview: book.content || '',
          platform: book.pingtai || platform,
          link: '', // 需要后续调用获取详情
        }));
        
        const result = {
          code: 'success',
          data: formattedBooks,
          message: `找到 ${formattedBooks.length} 条结果`,
        };
        this.logger.log(`返回格式化后的书籍: ${formattedBooks.length} 条`);
        return result;
      }
      
      // 错误情况
      if (code === 'error') {
        this.logger.warn('⚠️ 匹配到 error 分支');
        return {
          code: 'error',
          data: [],
          message: responseData.data || responseData.message || '搜索失败',
        };
      }
      
      // 未知格式
      this.logger.error('❌ 未知的响应格式，所有分支都不匹配');
      this.logger.error(`完整响应数据: ${JSON.stringify(responseData)}`);
      return {
        code: 'error',
        data: [],
        message: '未知的响应格式',
      };
    } catch (error) {
      this.logger.error(`搜索出错: ${error.message}`, error.stack);
      
      // 如果是axios错误，提供更详细的信息
      if (axios.isAxiosError(error)) {
        if (error.response) {
          this.logger.error(`远程API返回错误: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        } else if (error.request) {
          this.logger.error('远程API无响应');
        }
      }
      
      throw new HttpException(
        '搜索服务暂时不可用，请稍后再试',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * 获取书籍详情
   * 调用外部API获取HTML，然后解析返回结构化数据
   */
  async getBookDetail(detailDto: GetBookDetailDto, apiConfig: any) {
    const { bookId, platform } = detailDto;
    const remoteApiBaseUrl = apiConfig.apiBaseUrl || 'http://';
    
    try {
      this.logger.log(`获取书籍详情: bookId=${bookId}, platform=${platform}`);

      // 构建请求数据
      const postData = {
        action: 'get_bookinfo',
        book_id: bookId,
        book_pingtai: platform || '', // 添加平台参数
        kami: this.HARDCODED_KAMI,
      };

      // 调用远程API
      const remoteApiUrl = `${remoteApiBaseUrl}php/get_bookinfo.php`;
      
      const response = await axios.post(remoteApiUrl, new URLSearchParams(postData).toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: apiConfig.timeout || 30000,
      });

      let responseData = response.data;
      
      // 如果响应是字符串且包含PHP错误信息，提取JSON部分
      if (typeof responseData === 'string') {
        this.logger.log(`get_bookinfo原始响应（前200字符）: ${responseData.substring(0, 200)}`);
        
        // 查找最后一个 {，提取JSON部分
        const jsonStartIndex = responseData.lastIndexOf('{');
        if (jsonStartIndex !== -1) {
          const jsonString = responseData.substring(jsonStartIndex);
          try {
            responseData = JSON.parse(jsonString);
            this.logger.log(`成功提取JSON: ${JSON.stringify(responseData)}`);
          } catch (e) {
            this.logger.error(`JSON解析失败: ${e.message}`);
          }
        }
      }

      if (responseData && responseData.code === 'success' && responseData.data) {
        const htmlFilename = responseData.data;
        
        // 如果返回的是HTML文件名，需要获取HTML内容
        // HTML文件在 info/ 目录下
        const htmlUrl = `${remoteApiBaseUrl}info/${htmlFilename}`;
        this.logger.log(`获取HTML内容: ${htmlUrl}`);
        
        const htmlResponse = await axios.get(htmlUrl, {
          timeout: apiConfig.timeout || 30000,
        });

        // 解析HTML
        const parsedData = this.parseNovelHtml(htmlResponse.data);
        
        return {
          code: 'success',
          data: parsedData,
          message: '获取成功',
        };
      } else {
        this.logger.warn(`获取书籍详情失败: code=${responseData?.code}, data=${responseData?.data}`);
        return {
          code: 'error',
          data: null,
          message: responseData?.message || '获取书籍详情失败',
        };
      }
    } catch (error) {
      this.logger.error(`获取书籍详情出错: ${error.message}`, error.stack);
      throw new HttpException(
        '获取书籍详情失败，请稍后再试',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * 解析HTML内容，提取书籍标题和章节内容
   * 直接返回HTML标签，由前端渲染
   */
  private parseNovelHtml(html: string) {
    // 提取标题 - 从 <p id="name"> 或 <div class="bname_div"> 中提取
    let title = '未知标题';
    const nameMatch = html.match(/<p id="name"[^>]*>(.*?)<\/p>/s);
    if (nameMatch) {
      title = this.decodeHtmlEntities(nameMatch[1]).trim();
    } else {
      const bnameMatch = html.match(/<div class="bname_div"[^>]*>(.*?)<\/div>/s);
      if (bnameMatch) {
        title = this.decodeHtmlEntities(bnameMatch[1]).trim();
      }
    }
    
    // 提取章节内容 - 直接返回HTML，包含所有<p>标签
    let content = '';
    let totalParagraphs = 0;
    const chapterTextMatch = html.match(/<div class="chapter-text"[^>]*>(.*?)<\/div>/s);
    
    if (chapterTextMatch) {
      content = chapterTextMatch[1].trim();
      // 计算段落数量
      const paragraphMatches = content.match(/<p[^>]*>.*?<\/p>/gs);
      totalParagraphs = paragraphMatches ? paragraphMatches.length : 0;
    }
    
    return {
      title,
      content,
      totalParagraphs,
    };
  }

  /**
   * 解码HTML实体
   */
  private decodeHtmlEntities(text: string): string {
    return text
      .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
      .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/&ldquo;/g, '"')
      .replace(/&rdquo;/g, '"')
      .replace(/<[^>]+>/g, ''); // 移除剩余的HTML标签
  }
}
