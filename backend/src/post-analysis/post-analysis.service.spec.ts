import { Test, TestingModule } from '@nestjs/testing';
import { PostAnalysisService } from './post-analysis.service';

describe('PostAnalysisService', () => {
  let service: PostAnalysisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PostAnalysisService],
    }).compile();

    service = module.get<PostAnalysisService>(PostAnalysisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
