import { Creature } from '../../../creature';
import { Ability } from '../../../ability';

export class CacheManager {
    private caches: Map<string, Map<string, any>> = new Map();
    private readonly TTL = 1000;
    
    public getCache(name: string): Map<string, any> {
        if (!this.caches.has(name)) {
            this.caches.set(name, new Map());
        }
        return this.caches.get(name);
    }
    
    public cleanup(): void {
        const now = Date.now();
        this.caches.forEach(cache => {
            for (const [key, value] of cache.entries()) {
                if (now - value.timestamp > this.TTL) {
                    cache.delete(key);
                }
            }
        });
    }

    public getCacheKey(source: Creature, target: Creature, ability?: Ability): string {
        return `${source.id}-${target.id}-${ability?.id || 'noability'}-${source.game.turn}`;
    }
} 