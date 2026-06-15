import { Test, TestingModule } from '@nestjs/testing';
import { PostAnalysisController } from './post-analysis.controller';

describe('PostAnalysisController', () => {
  let controller: PostAnalysisController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostAnalysisController],
    }).compile();

    controller = module.get<PostAnalysisController>(PostAnalysisController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
