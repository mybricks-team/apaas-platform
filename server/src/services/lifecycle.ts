import {
  Injectable,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';

@Injectable()
export default class LifecycleService implements OnApplicationBootstrap, OnApplicationShutdown {
  onApplicationShutdown(signal?: string) {
    console.log('onApplicationShutdown', signal);
  }

  onApplicationBootstrap() {
    if(process?.send) {
      process.send('ready');
    }
  }

  

}


